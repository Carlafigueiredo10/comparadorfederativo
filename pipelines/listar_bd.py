"""Descoberta de tabelas/colunas no Base dos Dados.

Lista tabelas de um dataset público da BD ou colunas de uma tabela específica.
Útil pra explorar antes de criar um coletor novo (ex.: br_ana_atlas_esgotos).

Uso:
    python pipelines/listar_bd.py br_mdr_snis
    python pipelines/listar_bd.py br_ana_atlas_esgotos
    python pipelines/listar_bd.py br_mdr_snis municipio_agua_esgoto
"""

from __future__ import annotations

import argparse
import sys


def listar_tabelas(dataset: str, billing: str) -> int:
    import basedosdados as bd

    query = f"""
        SELECT table_name
        FROM `basedosdados.{dataset}.INFORMATION_SCHEMA.TABLES`
        ORDER BY table_name
    """
    df = bd.read_sql(query=query, billing_project_id=billing)
    print(f"# Tabelas em basedosdados.{dataset} ({len(df)})", file=sys.stderr)
    for _, linha in df.iterrows():
        print(linha["table_name"])
    return 0


def listar_colunas(dataset: str, tabela: str, billing: str) -> int:
    import basedosdados as bd

    query = f"""
        SELECT column_name, data_type
        FROM `basedosdados.{dataset}.INFORMATION_SCHEMA.COLUMNS`
        WHERE table_name = '{tabela}'
        ORDER BY column_name
    """
    df = bd.read_sql(query=query, billing_project_id=billing)
    print(
        f"# Colunas em basedosdados.{dataset}.{tabela} ({len(df)})",
        file=sys.stderr,
    )
    for _, linha in df.iterrows():
        print(f"{linha['column_name']:50s}  {linha['data_type']}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Lista tabelas/colunas de datasets públicos no Base dos Dados"
    )
    parser.add_argument("dataset", help="ex.: br_mdr_snis, br_ana_atlas_esgotos")
    parser.add_argument(
        "tabela",
        nargs="?",
        help="se informado, lista colunas dessa tabela; caso contrário lista tabelas",
    )
    parser.add_argument(
        "--billing-project",
        default="abrigo-gatos",
        help="GCP project id para billing (default: abrigo-gatos)",
    )
    args = parser.parse_args()

    try:
        import basedosdados  # noqa: F401
    except ImportError:
        raise SystemExit(
            "Pacote `basedosdados` não instalado. Rode:\n"
            "    pip install -r pipelines/requirements.txt"
        )

    if args.tabela:
        return listar_colunas(args.dataset, args.tabela, args.billing_project)
    return listar_tabelas(args.dataset, args.billing_project)


if __name__ == "__main__":
    raise SystemExit(main())
