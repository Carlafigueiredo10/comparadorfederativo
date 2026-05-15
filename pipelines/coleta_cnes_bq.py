"""Coletor CNES via BigQuery (Base dos Dados).

Calcula leitos hospitalares por mil habitantes por UF a partir da tabela pública
`basedosdados.br_ms_cnes.estabelecimento` (CNES — Cadastro Nacional de
Estabelecimentos de Saúde) cruzada com a população dos estados em
`data/states.json`. Saída: `data/snapshots/v<versao>/cnes.json`.

Pré-requisitos:
    pip install -r pipelines/requirements.txt
    gcloud auth application-default login

Uso:
    python pipelines/coleta_cnes_bq.py --ano 2024
    python pipelines/coleta_cnes_bq.py --listar-colunas
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SNAPSHOTS_DIR = REPO_ROOT / "data" / "snapshots"
STATES_JSON = REPO_ROOT / "data" / "states.json"

sys.path.insert(0, str(Path(__file__).resolve().parent))
from coleta_snis import UFS  # noqa: E402  — reusa lista canônica das 27 UFs

DATASET = "br_ms_cnes"
TABELA = "estabelecimento"

# CNES tem várias colunas de leito (existente, SUS, não-SUS, etc.). Pegamos
# 'leitos existentes' que é o total. Nomes podem variar entre revisões da BD.
CANDIDATOS = {
    "uf": ["sigla_uf"],
    "leitos": [
        "quantidade_leito_existente",
        "qt_leito_existente",
        "quantidade_leitos_existentes",
    ],
    "ano": ["ano"],
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


def _populacao_por_uf() -> dict[str, int]:
    states = json.loads(STATES_JSON.read_text(encoding="utf-8"))
    return {s["sigla"]: s["populacao"] for s in states}


def baixar_e_agregar(ano: int, billing: str) -> dict[str, dict]:
    bd, pd = _carregar_bd()

    col_uf = CANDIDATOS["uf"][0]
    col_leitos_pref = CANDIDATOS["leitos"][0]

    # Agregamos no servidor pra não baixar centenas de milhares de linhas.
    # Se o nome do leito não bater, a query falha e o usuário vê quais existem
    # via --listar-colunas.
    query = f"""
        SELECT {col_uf} AS uf, SUM({col_leitos_pref}) AS total_leitos
        FROM `basedosdados.{DATASET}.{TABELA}`
        WHERE ano = {int(ano)}
        GROUP BY {col_uf}
    """
    print(
        f"Consultando BQ: SUM({col_leitos_pref}) GROUP BY {col_uf} "
        f"em basedosdados.{DATASET}.{TABELA} ano={ano} (billing={billing})",
        file=sys.stderr,
    )
    df = bd.read_sql(query=query, billing_project_id=billing)
    print(f"  -> {len(df)} UFs com leitos contabilizados", file=sys.stderr)

    populacao = _populacao_por_uf()
    leitos_por_uf: dict[str, int] = {}
    for _, linha in df.iterrows():
        uf = str(linha["uf"] or "").strip().upper()
        leitos = linha["total_leitos"]
        if uf in UFS and pd.notna(leitos):
            leitos_por_uf[uf] = int(leitos)

    resultado: dict[str, dict] = {}
    for uf in UFS:
        total = leitos_por_uf.get(uf)
        pop = populacao.get(uf)
        if total is not None and pop:
            resultado[uf] = {
                "leitosPorMil": round(total / pop * 1000, 2),
                "total_leitos": total,
            }
        else:
            resultado[uf] = {"leitosPorMil": None, "total_leitos": 0}
    return resultado


def construir_snapshot(agregado: dict[str, dict], ano: int) -> dict:
    valores = []
    for uf in UFS:
        ag = agregado[uf]
        coletado = ag["leitosPorMil"] is not None
        valores.append({
            "uf": uf,
            "is_estimativa": not coletado,
            "total_leitos": ag["total_leitos"],
            "indicadores": {"leitosPorMil": ag["leitosPorMil"]},
        })
    cobertos = sum(1 for v in valores if not v["is_estimativa"])
    return {
        "fonte": "CNES",
        "url_fonte": "https://cnes.datasus.gov.br/",
        "ano_referencia": ano,
        "data_coleta": datetime.now(timezone.utc).isoformat(),
        "nota": (
            f"Coletado de basedosdados.{DATASET}.{TABELA} via BigQuery — "
            f"{cobertos}/27 UFs com dado real."
        ),
        "indicadores_descricao": {
            "leitosPorMil": (
                "Leitos hospitalares existentes (SUS + não-SUS) por mil habitantes. "
                "Total de leitos vem de SUM(quantidade_leito_existente) no CNES; "
                "população dos estados vem de data/states.json (Censo 2022)."
            ),
        },
        "valores": valores,
    }


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
    parser = argparse.ArgumentParser(description="Coletor CNES via BigQuery (Base dos Dados)")
    parser.add_argument("--ano", type=int, default=2024, help="ano de referência")
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

    saida = SNAPSHOTS_DIR / args.versao / "cnes.json"
    saida.parent.mkdir(parents=True, exist_ok=True)
    saida.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    cobertos = sum(1 for v in snapshot["valores"] if not v["is_estimativa"])
    print(f"CNES {args.ano}: {cobertos}/27 UFs com dado real -> {saida}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
