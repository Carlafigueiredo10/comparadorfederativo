"""Azure Functions (Python v2 model) — API da Plataforma de Perfis Estaduais.

Sprint 5: endpoints servem snapshots por fonte (SNIS, CNES, ...) com z-score
calculado entre as UFs que têm dado disponível.

Os snapshots ficam em `data/snapshots/v<ano>/`. Em runtime no Azure Static Web
Apps a pasta `data/` é copiada para dentro de `api/` pelo workflow de deploy;
em desenvolvimento local ela é lida da raiz do repositório.
"""

import json
import logging
from pathlib import Path

import azure.functions as func

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# Mapeamento de endpoint -> (arquivo de snapshot, proxies servidos).
# Os slugs dos proxies devem casar com os usados no protótipo (src/App.jsx).
FONTES = {
    "snis": {"arquivo": "snis.json", "proxies": ("aguaTratada", "esgotoColetado")},
    "cnes": {"arquivo": "cnes.json", "proxies": ("leitosPorMil",)},
}


def _data_dir() -> Path:
    """Resolve a pasta `data/`, seja no deploy (api/data) ou local (raiz/data)."""
    candidatos = [
        Path(__file__).parent / "data",          # copiada para dentro de api/ no deploy
        Path(__file__).parent.parent / "data",   # raiz do repo, em dev local
    ]
    for caminho in candidatos:
        if caminho.is_dir():
            return caminho
    raise FileNotFoundError("Pasta 'data/' não encontrada (nem em api/data nem na raiz)")


def _carregar_json(*partes: str) -> dict:
    caminho = _data_dir().joinpath(*partes)
    return json.loads(caminho.read_text(encoding="utf-8"))


def _z_scores(valores: dict[str, float]) -> dict[str, float]:
    """Z-score sobre as UFs que têm valor (ignora None). Universo = estados com dado."""
    presentes = {uf: v for uf, v in valores.items() if v is not None}
    n = len(presentes)
    if n == 0:
        return {}
    media = sum(presentes.values()) / n
    desvio = (sum((v - media) ** 2 for v in presentes.values()) / n) ** 0.5
    if desvio == 0:
        return {uf: 0.0 for uf in presentes}
    return {uf: round((v - media) / desvio, 4) for uf, v in presentes.items()}


def _resposta_json(corpo: dict, status: int = 200) -> func.HttpResponse:
    return func.HttpResponse(
        json.dumps(corpo, ensure_ascii=False),
        status_code=status,
        mimetype="application/json",
    )


def _versao_ativa() -> str | None:
    """Varre os manifests e retorna a versão marcada como ativa."""
    for manifest_path in sorted((_data_dir() / "snapshots").glob("*/manifest.json")):
        m = json.loads(manifest_path.read_text(encoding="utf-8"))
        if m.get("ativo"):
            return m["versao"]
    return None


def _servir_fonte(fonte: str, versao_pedida: str | None) -> func.HttpResponse:
    spec = FONTES[fonte]
    versao = versao_pedida or _versao_ativa()
    if versao is None:
        return _resposta_json({"erro": "nenhum snapshot ativo encontrado"}, status=404)

    try:
        snapshot = _carregar_json("snapshots", versao, spec["arquivo"])
    except FileNotFoundError:
        return _resposta_json(
            {"erro": f"{spec['arquivo']} ausente na versão '{versao}'"}, status=404
        )

    proxies = spec["proxies"]
    valores_por_uf = {item["uf"]: item.get("indicadores", {}) for item in snapshot["valores"]}

    z_por_proxy = {
        proxy: _z_scores({uf: ind.get(proxy) for uf, ind in valores_por_uf.items()})
        for proxy in proxies
    }

    estados = {
        uf: {
            "proxies": {
                proxy: {
                    "bruto": indicadores.get(proxy),
                    "z": z_por_proxy[proxy].get(uf),
                }
                for proxy in proxies
            }
        }
        for uf, indicadores in valores_por_uf.items()
    }

    cobertos = sum(
        1 for ind in valores_por_uf.values()
        if all(ind.get(p) is not None for p in proxies)
    )
    logging.info("%s %s: %d/%d UFs com dado completo", fonte.upper(), versao, cobertos, len(valores_por_uf))

    return _resposta_json({
        "fonte": snapshot.get("fonte"),
        "versao": versao,
        "ano_referencia": snapshot.get("ano_referencia"),
        "url_fonte": snapshot.get("url_fonte"),
        "proxies": list(proxies),
        "cobertura": {"completos": cobertos, "total": len(valores_por_uf)},
        "estados": estados,
    })


@app.route(route="snis", methods=["GET"])
def snis(req: func.HttpRequest) -> func.HttpResponse:
    """Indicadores SNIS (saneamento) por UF."""
    return _servir_fonte("snis", req.params.get("versao"))


@app.route(route="cnes", methods=["GET"])
def cnes(req: func.HttpRequest) -> func.HttpResponse:
    """Indicadores CNES (saúde) por UF."""
    return _servir_fonte("cnes", req.params.get("versao"))


@app.route(route="states", methods=["GET"])
def states(req: func.HttpRequest) -> func.HttpResponse:
    """Catálogo dos estados brasileiros."""
    try:
        return _resposta_json(_carregar_json("states.json"))
    except FileNotFoundError:
        return _resposta_json({"erro": "states.json não encontrado"}, status=404)
