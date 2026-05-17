"""Coletor ANA Atlas Esgotos via BigQuery (Base dos Dados).

Agrega por UF os indicadores municipais de cobertura de esgotamento sanitário
do Atlas Esgotos da ANA (diagnóstico 2013, publicado em 2017), a partir da
tabela pública `basedosdados.br_ana_atlas_esgotos.municipio`. Saída:
`data/snapshots/v<versao>/ana_atlas.json`.

Diferente do SNIS (que mede atendimento de esgoto referido à pop. com água),
o Atlas decompõe a cobertura em três faixas mutuamente exclusivas:
coleta+tratamento, solução individual (fossa), sem atendimento. Útil pra
diagnosticar o "tipo" de cobertura, não só o total.

Pré-requisitos:
    pip install -r pipelines/requirements.txt
    gcloud auth application-default login

Uso:
    python pipelines/coleta_ana_atlas.py
    python pipelines/coleta_ana_atlas.py --billing-project meu-projeto
    python pipelines/coleta_ana_atlas.py --listar-colunas
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SNAPSHOTS_DIR = REPO_ROOT / "data" / "snapshots"

sys.path.insert(0, str(Path(__file__).resolve().parent))
from coleta_snis import UFS  # noqa: E402  — reusa lista canônica das 27 UFs

DATASET = "br_ana_atlas_esgotos"
TABELA = "municipio"

# Tabela ANA Atlas não tem campo `ano`; o diagnóstico é de 2013, projeção 2035.
ANO_REFERENCIA = 2013

CANDIDATOS = {
    "uf": ["sigla_uf"],
    "populacao": ["populacao_urbana_2013"],
    "coletaTratamento": ["indice_atendimento_com_coleta_com_tratamento"],
    "solucaoIndividual": ["indice_atendimento_solucao_individual"],
    "semColetaSemTratamento": ["indice_sem_atendimento_sem_coleta_sem_tratamento"],
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


def baixar_e_agregar(billing: str) -> dict[str, dict]:
    bd, pd = _carregar_bd()

    query = f"""
        SELECT *
        FROM `basedosdados.{DATASET}.{TABELA}`
    """
    print(
        f"Consultando BQ: basedosdados.{DATASET}.{TABELA} (billing={billing})",
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
            f"Ajuste CANDIDATOS em pipelines/coleta_ana_atlas.py."
        )

    indicadores = ["coletaTratamento", "solucaoIndividual", "semColetaSemTratamento"]
    acc = {
        uf: {
            **{f"{ind}_num": 0.0 for ind in indicadores},
            "peso": 0.0,
            "municipios": 0,
        }
        for uf in UFS
    }
    for _, linha in df.iterrows():
        uf = str(linha[col["uf"]] or "").strip().upper()
        if uf not in acc:
            continue
        peso_raw = linha[col["populacao"]]
        peso = float(peso_raw) if pd.notna(peso_raw) else 0.0
        if peso <= 0:
            continue
        valores = {}
        for ind in indicadores:
            raw = linha[col[ind]]
            valores[ind] = float(raw) if pd.notna(raw) else None
        if all(v is None for v in valores.values()):
            continue
        for ind, v in valores.items():
            if v is not None:
                acc[uf][f"{ind}_num"] += v * peso
        acc[uf]["peso"] += peso
        acc[uf]["municipios"] += 1

    # ANA armazena os índices como fração 0–1. Multiplicamos por 100 pra alinhar
    # com o SNIS (que vem em % 0–100) e manter consistência entre snapshots.
    resultado: dict[str, dict] = {}
    for uf, a in acc.items():
        if a["peso"] > 0:
            resultado[uf] = {
                ind: round(a[f"{ind}_num"] / a["peso"] * 100, 2) for ind in indicadores
            }
            resultado[uf]["municipios"] = a["municipios"]
        else:
            resultado[uf] = {ind: None for ind in indicadores}
            resultado[uf]["municipios"] = 0
    return resultado


def construir_snapshot(agregado: dict[str, dict]) -> dict:
    valores = []
    for uf in UFS:
        ag = agregado[uf]
        coletado = ag["coletaTratamento"] is not None
        valores.append({
            "uf": uf,
            "is_estimativa": not coletado,
            "municipios": ag["municipios"],
            "indicadores": {
                "coletaTratamento": ag["coletaTratamento"],
                "solucaoIndividual": ag["solucaoIndividual"],
                "semColetaSemTratamento": ag["semColetaSemTratamento"],
            },
        })
    cobertos = sum(1 for v in valores if not v["is_estimativa"])
    return {
        "fonte": "ANA Atlas Esgotos",
        "url_fonte": "https://www.snirh.gov.br/portal/centrais-de-conteudos/atlas",
        "ano_referencia": ANO_REFERENCIA,
        "data_coleta": datetime.now(timezone.utc).isoformat(),
        "nota": (
            f"Coletado de basedosdados.{DATASET}.{TABELA} via BigQuery — "
            f"{cobertos}/27 UFs com dado real. Agregação ponderada por "
            f"populacao_urbana_2013."
        ),
        "indicadores_descricao": {
            "coletaTratamento": (
                "Índice de atendimento com coleta e tratamento de esgoto "
                "(ANA Atlas 2013), % da população urbana"
            ),
            "solucaoIndividual": (
                "Índice de atendimento por solução individual — fossa séptica "
                "(ANA Atlas 2013), % da população urbana"
            ),
            "semColetaSemTratamento": (
                "Índice sem atendimento — sem coleta e sem tratamento "
                "(ANA Atlas 2013), % da população urbana"
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
    parser = argparse.ArgumentParser(
        description="Coletor ANA Atlas Esgotos via BigQuery (Base dos Dados)"
    )
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

    agregado = baixar_e_agregar(args.billing_project)
    snapshot = construir_snapshot(agregado)

    saida = SNAPSHOTS_DIR / args.versao / "ana_atlas.json"
    saida.parent.mkdir(parents=True, exist_ok=True)
    saida.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    cobertos = sum(1 for v in snapshot["valores"] if not v["is_estimativa"])
    print(f"ANA Atlas {ANO_REFERENCIA}: {cobertos}/27 UFs com dado real -> {saida}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
