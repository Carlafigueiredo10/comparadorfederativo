# data/raw — downloads brutos das fontes oficiais

Esta pasta guarda os arquivos baixados manualmente das fontes que não têm API
REST estruturada. Eles **são commitados** no repositório para reprodutibilidade
(a estratégia do Sprint 5 é "download manual + commit").

## SNIS — saneamento

1. Acesse a área **Diagnósticos** em http://snis.gov.br/
2. Baixe a série histórica de indicadores agregados (CSV).
3. Salve aqui como `snis_2024.csv` (ajuste o ano conforme o dado disponível).
4. Rode o coletor:

   ```bash
   python pipelines/coleta_snis.py
   ```

O coletor lê este CSV, agrega por UF e regrava `data/snapshots/v2026/snis.json`.

### Colunas esperadas no CSV

O coletor procura, por linha de município, as colunas:

- `Estado` ou `UF` — sigla da unidade federativa
- `População atendida` (ou `População total atendida`) — para ponderar a média
- `IN055` — Índice de atendimento total de água
- `IN056` — Índice de atendimento total de esgoto

Se os nomes das colunas no CSV do SNIS forem diferentes, ajuste o mapeamento
em `pipelines/coleta_snis.py` (constante `COLUNAS`).
