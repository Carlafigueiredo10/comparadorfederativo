# pipelines — coletores de dados

Scripts Python que leem fontes oficiais e geram os snapshots versionados em
`data/snapshots/v<versao>/`. Rodados manualmente no Sprint 5; depois agendados
via GitHub Actions.

| Script | Fonte | Entrada | Saída |
|---|---|---|---|
| `coleta_snis.py` | SNIS (saneamento) | `data/raw/snis_<ano>.csv` (CSV manual) | `data/snapshots/v2026/snis.json` |
| `coleta_snis_bq.py` | SNIS via BigQuery (Base dos Dados) | `basedosdados.br_mdr_snis.municipio_agua_esgoto` | `data/snapshots/v2026/snis.json` |
| `coleta_cnes_bq.py` | CNES (saúde, leitos) via BigQuery | `basedosdados.br_ms_cnes.estabelecimento` + `data/states.json` | `data/snapshots/v2026/cnes.json` |
| `coleta_ana_atlas.py` | ANA Atlas Esgotos via BigQuery | `basedosdados.br_ana_atlas_esgotos.municipio` | `data/snapshots/v2026/ana_atlas.json` |
| `listar_bd.py` | — | qualquer dataset público da BD | stdout (descoberta) |

## Como rodar

### Coletor offline (CSV manual)

```bash
python pipelines/coleta_snis.py            # ano 2024, versão v2026
python pipelines/coleta_snis.py --ano 2023 --versao v2025
```

Sem dependências externas — qualquer Python 3.11+ roda.

### Coletor via BigQuery (Base dos Dados)

Caminho preferido a partir do Sprint 5: pulamos o download manual e batemos
direto na tabela pública da BD.

```bash
# 1. instalar deps (uma vez)
pip install -r pipelines/requirements.txt

# 2. autenticar no GCP (uma vez por máquina)
gcloud auth application-default login

# 3. rodar
python pipelines/coleta_snis_bq.py --ano 2022
python pipelines/coleta_cnes_bq.py --ano 2024
python pipelines/coleta_ana_atlas.py
```

> `coleta_ana_atlas.py` não tem `--ano`: a tabela do Atlas é o diagnóstico ANA
> 2013 (publicado em 2017), sem revisões anuais. O ano de referência é fixo.

Flags úteis:
- `--billing-project <id>` — GCP project que paga o scan (default: `abrigo-gatos`)
- `--listar-colunas` — só lista colunas da tabela e sai; útil quando a BD
  renomeia algo e o coletor reclama de coluna ausente

### Descoberta de outras tabelas

Pra explorar `br_ana_atlas_esgotos` e demais datasets antes de escrever um
coletor novo:

```bash
python pipelines/listar_bd.py br_ana_atlas_esgotos                # lista tabelas
python pipelines/listar_bd.py br_ana_atlas_esgotos municipio      # lista colunas
```

## Dependências

`requirements.txt` lista `basedosdados` (que traz pandas + google-cloud-bigquery
transitivamente) — necessário apenas para os coletores BQ. O `coleta_snis.py`
original continua funcionando sem `pip install` algum.
