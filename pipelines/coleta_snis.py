"""Coletor SNIS — saneamento por UF.

Lê o CSV bruto baixado manualmente do portal SNIS (data/raw/snis_<ano>.csv),
agrega os indicadores municipais em médias ponderadas por população atendida
e regrava data/snapshots/v<versao>/snis.json.

Uso:
    python pipelines/coleta_snis.py                # ano 2024, versão v2026
    python pipelines/coleta_snis.py --ano 2023
    python pipelines/coleta_snis.py --csv outro.csv --versao v2025

Sem dependências externas (stdlib apenas), conforme decisão técnica do projeto.
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = REPO_ROOT / "data" / "raw"
SNAPSHOTS_DIR = REPO_ROOT / "data" / "snapshots"

# 27 UFs — o snapshot sempre tem as 27 linhas, mesmo as ainda não coletadas.
UFS = [
    "AC", "AP", "AM", "PA", "RO", "RR", "TO",
    "AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE",
    "DF", "GO", "MT", "MS",
    "ES", "MG", "RJ", "SP",
    "PR", "RS", "SC",
]

# Nomes candidatos de coluna no CSV do SNIS (varia entre anos/exports).
# Ajuste aqui se o seu CSV usar outros rótulos.
COLUNAS = {
    "uf": ["Estado", "UF", "Sigla do Estado", "Unidade da Federação"],
    "populacao": [
        "População total atendida com abastecimento de água",
        "População atendida",
        "População total residente",
        "POP_TOT",
    ],
    "aguaTratada": [
        "IN055", "IN055 - Índice de atendimento total de água",
        "Índice de atendimento total de água",
    ],
    "esgotoColetado": [
        "IN056", "IN056 - Índice de atendimento total de esgoto",
        "Índice de atendimento total de esgoto",
    ],
}


def _achar_coluna(cabecalho: list[str], candidatos: list[str]) -> str | None:
    norm = {c.strip().lower(): c for c in cabecalho}
    for cand in candidatos:
        if cand.strip().lower() in norm:
            return norm[cand.strip().lower()]
    return None


def _num(valor: str) -> float | None:
    """Converte número em formato brasileiro ('1.234,56') ou internacional."""
    if valor is None:
        return None
    txt = valor.strip()
    if not txt or txt.upper() in {"NA", "N/A", "-", "..."}:
        return None
    txt = txt.replace(".", "").replace(",", ".") if "," in txt else txt
    try:
        return float(txt)
    except ValueError:
        return None


def _detectar_dialeto(amostra: str) -> csv.Dialect:
    try:
        return csv.Sniffer().sniff(amostra, delimiters=";,\t")
    except csv.Error:
        dialeto = csv.excel
        dialeto.delimiter = ";"  # default do SNIS
        return dialeto


def agregar_por_uf(csv_path: Path) -> dict[str, dict]:
    """Lê o CSV municipal e devolve {UF: {aguaTratada, esgotoColetado, municipios}}."""
    texto = csv_path.read_text(encoding="utf-8-sig", errors="replace")
    dialeto = _detectar_dialeto(texto[:4096])
    leitor = csv.DictReader(texto.splitlines(), dialect=dialeto)
    cabecalho = leitor.fieldnames or []

    col = {chave: _achar_coluna(cabecalho, cands) for chave, cands in COLUNAS.items()}
    faltando = [k for k, v in col.items() if v is None]
    if faltando:
        raise SystemExit(
            f"Colunas não encontradas no CSV: {faltando}\n"
            f"Cabeçalho lido: {cabecalho}\n"
            f"Ajuste o mapeamento COLUNAS em pipelines/coleta_snis.py."
        )

    # acumuladores ponderados por população
    acc = {uf: {"agua_num": 0.0, "esg_num": 0.0, "peso": 0.0, "municipios": 0} for uf in UFS}

    for linha in leitor:
        uf = (linha.get(col["uf"]) or "").strip().upper()
        if uf not in acc:
            continue
        peso = _num(linha.get(col["populacao"])) or 0.0
        agua = _num(linha.get(col["aguaTratada"]))
        esg = _num(linha.get(col["esgotoColetado"]))
        if peso <= 0 or (agua is None and esg is None):
            continue
        if agua is not None:
            acc[uf]["agua_num"] += agua * peso
        if esg is not None:
            acc[uf]["esg_num"] += esg * peso
        acc[uf]["peso"] += peso
        acc[uf]["municipios"] += 1

    resultado: dict[str, dict] = {}
    for uf, a in acc.items():
        if a["peso"] > 0:
            resultado[uf] = {
                "aguaTratada": round(a["agua_num"] / a["peso"], 2),
                "esgotoColetado": round(a["esg_num"] / a["peso"], 2),
                "municipios": a["municipios"],
            }
        else:
            resultado[uf] = {"aguaTratada": None, "esgotoColetado": None, "municipios": 0}
    return resultado


def construir_snapshot(agregado: dict[str, dict], ano: int) -> dict:
    valores = []
    for uf in UFS:
        ag = agregado[uf]
        coletado = ag["aguaTratada"] is not None or ag["esgotoColetado"] is not None
        valores.append({
            "uf": uf,
            "is_estimativa": not coletado,
            "municipios": ag["municipios"],
            "indicadores": {
                "aguaTratada": ag["aguaTratada"],
                "esgotoColetado": ag["esgotoColetado"],
            },
        })
    cobertos = sum(1 for v in valores if not v["is_estimativa"])
    return {
        "fonte": "SNIS",
        "url_fonte": "http://snis.gov.br/diagnostico-anual",
        "ano_referencia": ano,
        "data_coleta": datetime.now(timezone.utc).isoformat(),
        "nota": f"Coletado de data/raw via coleta_snis.py — {cobertos}/27 UFs com dado real.",
        "indicadores_descricao": {
            "aguaTratada": "Índice de atendimento total de água (SNIS IN055), % da população",
            "esgotoColetado": "Índice de atendimento total de esgoto (SNIS IN056), % da população",
        },
        "valores": valores,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Coletor SNIS por UF")
    parser.add_argument("--ano", type=int, default=2024, help="ano de referência do SNIS")
    parser.add_argument("--versao", default="v2026", help="versão do snapshot (pasta de saída)")
    parser.add_argument("--csv", help="caminho do CSV bruto (default: data/raw/snis_<ano>.csv)")
    args = parser.parse_args()

    csv_path = Path(args.csv) if args.csv else RAW_DIR / f"snis_{args.ano}.csv"
    if not csv_path.is_file():
        print(f"ERRO: CSV não encontrado em {csv_path}", file=sys.stderr)
        print("Baixe o diagnóstico do SNIS e salve em data/raw/ (ver data/raw/README.md).",
              file=sys.stderr)
        return 1

    agregado = agregar_por_uf(csv_path)
    snapshot = construir_snapshot(agregado, args.ano)

    saida = SNAPSHOTS_DIR / args.versao / "snis.json"
    saida.parent.mkdir(parents=True, exist_ok=True)
    saida.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    cobertos = sum(1 for v in snapshot["valores"] if not v["is_estimativa"])
    print(f"SNIS {args.ano}: {cobertos}/27 UFs com dado real -> {saida}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
