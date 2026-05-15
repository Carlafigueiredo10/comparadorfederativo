"""Coletor SNIS via BigQuery (Base dos Dados).

Substitui o caminho 'baixar CSV manualmente' (coleta_snis.py) por uma query
direta à tabela pública `basedosdados.br_mdr_snis.municipio_agua_esgoto`.
Mantém o mesmo schema de saída: agregação por UF em
`data/snapshots/v<versao>/snis.json`.

Pré-requisitos:
    pip install -r pipelines/requirements.txt
    gcloud auth application-default login

Uso:
    python pipelines/coleta_snis_bq.py --ano 2022
    python pipelines/coleta_snis_bq.py --ano 2022 --billing-project meu-projeto
    python pipelines/coleta_snis_bq.py --listar-colunas
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SNAPSHOTS_DIR = REPO_ROOT / "data" / "snapshots"

sys.path.insert(0, str(Path(__file__).resolve().parent))
from coleta_snis import UFS, construir_snapshot  # noqa: E402

DATASET = "br_mdr_snis"
TABELA = "municipio_agua_esgoto"

# Nomes candidatos por chave lógica. A BD às vezes ajusta nomes entre revisões
# do dataset; o coletor tenta o primeiro que casar e falha com mensagem clara
# caso nenhum exista. Use --listar-colunas pra ver o que veio.
CANDIDATOS = {
    "uf": ["sigla_uf"],
    "populacao": [
        "populacao_atendida_agua",
        "populacao_atentida_agua",
        "populacao_total_residente",
    ],
    "aguaTratada": [
        "indice_atendimento_total_agua",  # SNIS IN055
    ],
    "esgotoColetado": [
        # Atendimento de esgoto referido à população atendida com água. Na BD é
        # a única coluna de "% de cobertura de esgoto" preenchida em 2022 — as
        # variantes `agua_esgoto` e `esgoto_esgoto` vêm NaN em todas as UFs.
        "indice_atendimento_esgoto_agua",
    ],
}


def _achar_coluna(colunas, candidatos):
    cols_lower = {c.lower(): c for c in colunas}
    for c in candidatos:
        if c.lower() in cols_lower:
            return cols_lower[c.lower()]
    return None


def _carregar_bd():
    try:
        import basedosdados as bd
        import pandas as pd
    except ImportError as exc:
        raise SystemExit(
            f"Pacote ausente: {exc.name}. Rode:\n"
            f"    pip install -r pipelines/requirements.txt"
        )
    return bd, pd


def baixar_e_agregar(ano: int, billing: str) -> dict[str, dict]:
    bd, pd = _carregar_bd()

    query = f"""
        SELECT *
        FROM `basedosdados.{DATASET}.{TABELA}`
        WHERE ano = {int(ano)}
    """
    print(
        f"Consultando BQ: basedosdados.{DATASET}.{TABELA} ano={ano} "
        f"(billing={billing})",
        file=sys.stderr,
    )
    df = bd.read_sql(query=query, billing_project_id=billing)
    print(f"  -> {len(df)} linhas, {len(df.columns)} colunas", file=sys.stderr)

    col = {chave: _achar_coluna(df.columns, cands) for chave, cands in CANDIDATOS.items()}
    faltando = [k for k, v in col.items() if v is None]
    if faltando:
        raise SystemExit(
            f"Colunas não encontradas: {faltando}\n"
            f"Disponíveis: {sorted(df.columns)}\n"
            f"Ajuste CANDIDATOS em pipelines/coleta_snis_bq.py."
        )

    acc = {uf: {"agua_num": 0.0, "esg_num": 0.0, "peso": 0.0, "municipios": 0} for uf in UFS}
    for _, linha in df.iterrows():
        uf = str(linha[col["uf"]] or "").strip().upper()
        if uf not in acc:
            continue
        peso_raw = linha[col["populacao"]]
        peso = float(peso_raw) if pd.notna(peso_raw) else 0.0
        if peso <= 0:
            continue
        agua_raw = linha[col["aguaTratada"]]
        esg_raw = linha[col["esgotoColetado"]]
        agua = float(agua_raw) if pd.notna(agua_raw) else None
        esg = float(esg_raw) if pd.notna(esg_raw) else None
        if agua is None and esg is None:
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


def listar_colunas(billing: str) -> int:
    bd, _ = _carregar_bd()
    query = f"""
        SELECT column_name, data_type
        FROM `basedosdados.{DATASET}.INFORMATION_SCHEMA.COLUMNS`
        WHERE table_name = '{TABELA}'
        ORDER BY column_name
    """
    df = bd.read_sql(query=query, billing_project_id=billing)
    for _, linha in df.iterrows():
        print(f"{linha['column_name']:50s}  {linha['data_type']}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Coletor SNIS via BigQuery (Base dos Dados)")
    parser.add_argument("--ano", type=int, default=2022, help="ano de referência")
    parser.add_argument("--versao", default="v2026", help="versão do snapshot (pasta de saída)")
    parser.add_argument(
        "--billing-project",
        default="abrigo-gatos",
        help="GCP project id para billing das queries (default: abrigo-gatos)",
    )
    parser.add_argument(
        "--listar-colunas",
        action="store_true",
        help="apenas lista colunas da tabela e sai (não gera snapshot)",
    )
    args = parser.parse_args()

    if args.listar_colunas:
        return listar_colunas(args.billing_project)

    agregado = baixar_e_agregar(args.ano, args.billing_project)
    snapshot = construir_snapshot(agregado, args.ano)
    snapshot["indicadores_descricao"]["esgotoColetado"] = (
        "Índice de atendimento de esgoto referido à população atendida com "
        "água (SNIS, equivalente próximo a IN046), % da população atendida com água"
    )
    cobertos = sum(1 for v in snapshot["valores"] if not v["is_estimativa"])
    snapshot["nota"] = (
        f"Coletado de basedosdados.{DATASET}.{TABELA} via BigQuery — "
        f"{cobertos}/27 UFs com dado real."
    )

    saida = SNAPSHOTS_DIR / args.versao / "snis.json"
    saida.parent.mkdir(parents=True, exist_ok=True)
    saida.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"SNIS {args.ano}: {cobertos}/27 UFs com dado real -> {saida}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
