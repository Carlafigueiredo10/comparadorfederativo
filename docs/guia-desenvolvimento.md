# Guia de Desenvolvimento

> Sprints concretos, fontes de dados detalhadas, contratos esperados e passo a passo para sair do protótipo até produção.

---

## Status atual

| Sprint | Status | Entregável |
|---|---|---|
| 1.0 a 1.3 | ✅ Concluído | Base conceitual (refundação, abandono Hofstede, 5 dimensões iniciais) |
| 2.0 | ✅ Concluído | Visão Operacional adicionada (7 dimensões) |
| 3.0 | ✅ Concluído | Participação Cívica + Confiança Institucional + Capacidade de Acesso ao Estado (15 dimensões totais) |
| 4.0 | ✅ Concluído | Modo Configurado, templates, score customizado |
| **5.0** | **🟡 Em curso** | **Expansão para 27 estados via Azure Functions** |
| 6.0 | ⚪ Planejado | Validação metodológica formal |
| 7.0 | ⚪ Planejado | Cruzamento de visões, URL compartilhável, exportação |

---

## Sprint 5 — Expansão para 27 estados

### Objetivo

Sair do piloto com 5 estados (SP, BA, RS, PA, GO) e cobrir todos os 27 estados brasileiros (26 UFs + DF) com dados oficiais reais via APIs estruturadas.

### Tarefas

#### 5.1 — Setup do projeto

- [x] Migrar protótipo para projeto Vite
- [x] Configurar deploy Azure Static Web Apps com GitHub Actions
- [x] Adicionar configuração local de Azure MCP
- [ ] Estruturar pasta `api/` para Azure Functions managed do SWA
- [ ] CI/CD estendido para também publicar Functions

#### 5.2 — Modelo de dados

Como vamos rodar via Azure Functions + storage estático, o modelo é:
- **Snapshots em JSON versionados** em `data/snapshots/v2026/<fonte>.json`
- Functions HTTP servem agregados por estado/dimensão a partir desses JSONs
- Migração para banco relacional (Cosmos ou Postgres) só se houver necessidade de escrita transacional

- [ ] Definir schema de `data/snapshots/v2026/snis.json` (1ª fonte)
- [ ] Definir schema dos demais arquivos por fonte
- [ ] Documentar convenções em `docs/dados.md`

#### 5.3 — Pipelines de coleta (priorizados)

Cada coletor é um script Python standalone em `pipelines/` que pode ser rodado local ou via GitHub Action agendada. Saída padrão: JSON em `data/snapshots/v2026/`.

**Bloco 1 — fontes mais confiáveis e estruturadas:**
- [ ] **SNIS Saneamento** (Sistema Nacional de Informações sobre Saneamento) — primeiro a implementar
- [ ] **CNES Saúde** (DataSUS)
- [ ] **INEP IDEB**
- [ ] **PNAD Contínua** (IBGE SIDRA — Gini, escolaridade, tamanho domicílio)

**Bloco 2 — fontes importantes:**
- [ ] **TSE** comparecimento eleitoral
- [ ] **CGU** Escala Brasil Transparente
- [ ] **STN** receitas estaduais
- [ ] **PNAD TIC** (CGI.br/Cetic — atenção: pode precisar scraping autorizado)

**Bloco 3 — fontes complementares:**
- [ ] **CNJ** Justiça em Números (judicialização)
- [ ] **IBGE Estatísticas de Gênero** (mulheres em gerência)
- [ ] **RAIS** formalização do trabalho
- [ ] **MDS CadSUAS** (CRAS, CREAS)
- [ ] **IBGE FASFIL** (associativismo)

#### 5.4 — Azure Functions

- [ ] `api/snis/` (HTTP trigger): retorna JSON consolidado por UF
- [ ] `api/scores/` (HTTP trigger): score normalizado por dimensão e estado
- [ ] `api/templates/` (HTTP trigger): catálogo de templates
- [ ] Cache em memória dentro da Function (TTL longo, leitura é idempotente)

#### 5.5 — Frontend de produção

- [x] Migrar protótipo `.jsx` para projeto Vite
- [ ] Refatorar `App.jsx` em componentes modulares (RadarChart, ConfigPanel, etc.)
- [ ] Separar lógica de cálculo em `src/lib/`
- [ ] Hooks para chamadas de API (fetch nativo + cache simples)
- [ ] Tema customizado (paleta editorial: Fraunces + IBM Plex, aubergine accent, mesma do Governatech)

#### 5.6 — Testes

- [ ] Testes unitários dos cálculos (z-score, percentil, score customizado)
- [ ] Testes de integração das Functions (mock das APIs externas)
- [ ] Testes E2E básicos (Playwright): templates aplicam corretamente, URL compartilhável funciona

#### 5.7 — Documentação dos dados

- [ ] Para cada proxy: documentar fonte exata, ano de referência, URL de onde foi coletado, último update
- [ ] Página "Sobre os dados" no frontend com tabela completa

### Critério de sucesso do Sprint 5

- 27 estados × 15 dimensões = 405 cells; meta: 80% com dado oficial real (não estimativa)
- Pipelines de atualização rodando manualmente via npm/python script
- Deploy público acessível via Azure SWA
- Documentação técnica atualizada

### Estimativa de esforço

- Setup Functions + 1ª fonte (SNIS): 1 semana
- Pipelines de coleta (resto do Bloco 1): 1 semana
- Pipelines de coleta (Bloco 2 + 3): 1-2 semanas
- API Functions completa + cache: 3-5 dias
- Refatoração frontend modular: 1 semana
- Testes + documentação: 3-5 dias
- **Total estimado: 5-6 semanas** (com 1 pessoa em meio período)

---

## Fontes de dados — detalhamento

### IBGE SIDRA — PNAD Contínua

**URL base:** `https://servicodados.ibge.gov.br/api/v3/agregados/`

**Tabelas relevantes:**
- Tabela 7435 — Rendimento médio mensal e Gini por UF
- Tabela 6402 — Pessoas ocupadas por tipo de ocupação (incluindo cargos gerenciais)
- Tabela 7113 — Características de domicílios e moradores

**Exemplo de chamada:**
```python
import requests

url = "https://servicodados.ibge.gov.br/api/v3/agregados/7435/periodos/2024/variaveis/10267"
params = {
    "localidades": "N3[all]",  # todos os estados
    "classificacao": "11933[all]"
}
response = requests.get(url, params=params)
data = response.json()
```

**Atenção:**
- Documentação oficial: https://servicodados.ibge.gov.br/api/docs/agregados
- Cuidado com timeouts (algumas chamadas demoram >30s)
- Variáveis e classificações têm IDs numéricos que precisam ser descobertos via SIDRA web

---

### IBGE Censo 2022

**Status:** Disponível via SIDRA, dados consolidados em 2024.

**Tabelas relevantes:**
- Tabela 4711 — População por situação do domicílio (urbano/rural)
- Tabela 4712 — Domicílios e moradores

**Cobertura:** Total para os 27 estados.

---

### SNIS — Sistema Nacional de Informações sobre Saneamento

**URL:** http://snis.gov.br/

**Status:** Migrando para SINISA. Dados anuais com defasagem de ~2 anos (em 2026, dados de 2024 disponíveis).

**Indicadores principais:**
- IN055 — Índice de atendimento total de água
- IN056 — Índice de atendimento total de esgoto
- IN046 — Índice de esgoto tratado referido à água consumida

**Como coletar:**
1. Download das séries históricas em CSV pela área "Diagnósticos"
2. Filtragem por UF (campo "Estado")
3. Cálculo de médias ponderadas por população dos municípios (atenção: SNIS é municipal, precisa agregar)

**Alternativa:** API do INSA (Instituto Nacional do Semiárido) consolida alguns indicadores estaduais.

---

### CNES — Cadastro Nacional de Estabelecimentos de Saúde

**URL:** https://cnes.datasus.gov.br/

**Indicadores principais:**
- Leitos hospitalares por mil habitantes
- Estabelecimentos de saúde por tipo
- Profissionais de saúde por categoria

**Como coletar:**
- Tabnet (interface web) — exportar TSV
- API: `http://cnes.datasus.gov.br/services/`
- Dados são mensais; consolidar média anual

**Cobertura:** Total para os 27 estados.

---

### INEP

**URL:** https://www.gov.br/inep/pt-br

**Indicadores principais:**
- IDEB (Índice de Desenvolvimento da Educação Básica) — bienal
- Censo Escolar (anual)
- Indicadores de fluxo (taxa de aprovação, reprovação, abandono)

**Como coletar:**
- Página "Resultados e Indicadores"
- Download de planilhas Excel/CSV consolidadas
- IDEB tem desagregação por UF

---

### TSE — Tribunal Superior Eleitoral

**URL:** https://dadosabertos.tse.jus.br/

**Indicadores principais:**
- Comparecimento e abstenção por eleição (UF)
- Perfil do eleitorado (educação, gênero, etc.)

**Como coletar:**
- Portal de Dados Abertos do TSE (CKAN)
- Datasets em CSV, anuais por eleição
- Cuidado: arquivos podem ser grandes (>1M linhas), usar streaming

**Atenção metodológica:** comparecimento varia entre eleições presidenciais (alto) e municipais (médio). Padronizar ano de referência.

---

### CNJ — Conselho Nacional de Justiça

**URL:** https://www.cnj.jus.br/pesquisas-judiciarias/justica-em-numeros/

**Indicadores principais:**
- Casos novos por 100 mil habitantes
- Taxa de congestionamento
- Despesa do Judiciário por habitante

**Como coletar:**
- Relatório "Justiça em Números" (PDF anual + tabelas Excel)
- Não tem API oficial; extração manual ou web scraping autorizado

**Atenção metodológica importante:** judicialização é proxy ambíguo. Considerar:
- Excluir ações de saúde e previdência (distorcem indicador)
- Separar Justiça Estadual de Federal
- Por habitante, não absoluto

---

### CGU — Escala Brasil Transparente

**URL:** https://www.gov.br/cgu/pt-br/assuntos/transparencia-publica/escala-brasil-transparente

**Indicadores:**
- Avaliação de transparência ativa e passiva (escala 0-10)
- Avaliação por UF e por município

**Como coletar:**
- Painel público, exportação CSV
- Atualização bienal

---

### CGI.br / Cetic — TIC Domicílios

**URL:** https://cetic.br/pt/pesquisa/domicilios/

**Indicadores principais:**
- % domicílios com acesso à internet
- Tipos de conexão (banda larga fixa, móvel)
- Equipamentos por domicílio

**Como coletar:**
- Não há API pública estruturada
- Microdados disponíveis após cadastro
- Relatório anual com tabelas por UF

---

### STN — Tesouro Nacional

**URL:** https://www.tesourotransparente.gov.br/

**Indicadores principais:**
- Receitas estaduais (Siconfi)
- Despesas estaduais
- Receita per capita

**Como coletar:**
- API REST do Siconfi: `https://apidatalake.tesouro.gov.br/`
- Bem documentada, retorna JSON

---

### IPEAdata

**URL:** http://www.ipeadata.gov.br/

**Indicadores:** agregador de muitas séries históricas (renda, educação, demografia).

**Como coletar:**
- API REST: `http://www.ipeadata.gov.br/api/odata4/`
- Códigos de séries precisam ser descobertos no portal

---

### Banco Central — SGS

**URL:** https://www3.bcb.gov.br/sgspub/

**Indicadores:** crédito, bancarização, séries financeiras.

**Como coletar:**
- API: `https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados`
- Series têm IDs numéricos
- Algumas séries são estaduais

---

### MDS — CadSUAS / Cadastro Único

**URL:** https://aplicacoes.mds.gov.br/sagi/

**Indicadores principais:**
- CRAS e CREAS por município
- Cobertura de Bolsa Família / Auxílio Brasil
- Indicadores de pobreza

**Como coletar:**
- Painel SAGI, exportação manual
- Algumas séries via download estruturado

---

## Sprint 6 — Validação metodológica formal

### Por que esse sprint existe

Até aqui, a plataforma é **plausível**. Não é **validada**. Sprint 6 transforma isso.

### Tarefas

#### 6.1 — Análise de componentes principais (PCA)

- [ ] Rodar PCA sobre matriz 27 × 15 (estados × dimensões)
- [ ] Calcular % da variância explicada pelo primeiro componente
- [ ] **Interpretação:**
  - Se PC1 > 70%: índice está medindo um único eixo (provável modernização). Reduzir dimensões redundantes.
  - Se PC1 entre 40-70%: há múltiplas dimensões, validar quais.
  - Se PC1 < 40%: dimensões são independentes, posição forte.

#### 6.2 — Validação convergente externa

Testar correlação das dimensões com variáveis externas independentes (não usadas no índice):

| Dimensão | Variável-teste externa |
|---|---|
| Hierarquização Social | Índice de Theil (renda) |
| Configuração de Vínculos | Taxa de migração interestadual |
| Conectividade Digital | Volume de transações Pix per capita |
| Cobertura de Saúde | Expectativa de vida ao nascer |
| Vitalidade Cultural | Premiações Lei Aldir Blanc per capita |
| Participação Cívica | Doações políticas declaradas per capita |

Se uma dimensão não correlaciona com nenhuma variável externa relevante, **não está medindo nada útil**.

#### 6.3 — Análise de sensibilidade

- [ ] Leave-one-proxy-out: recalcular scores removendo um proxy de cada vez. O ranking muda muito?
- [ ] Leave-one-state-out: remover um estado, recalcular z-scores. Outros ficam estáveis?
- [ ] Comparar pesos iguais vs. pesos PCA-derivados

#### 6.4 — Estabilidade temporal

- [ ] Comparar versão v2026 com v2025 (ou snapshot anterior)
- [ ] Mudanças bruscas sem mudança de realidade indicam instabilidade

### Entregável

- Documento técnico de validação (papel acadêmico curto, formato workshop)
- Possível redução do número de dimensões
- Pesos ajustados baseados em dado, não achismo

---

## Sprint 7 — Cruzamento e funcionalidades avançadas

### Tarefas

#### 7.1 — URL compartilhável

- [ ] Encodificar configuração em querystring (base64)
- [ ] Endpoint `/api/config/share/` para configurações longas
- [ ] Botão "Compartilhar análise" na UI

#### 7.2 — Exportação

- [ ] PDF do radar atual com tabela de decomposição
- [ ] CSV dos dados brutos
- [ ] Citação automática para uso acadêmico

#### 7.3 — Templates expandidos

Adicionar templates avançados baseados em uso real:
- "Atração de investimentos estrangeiros"
- "Expansão de rede bancária"
- "Foco de atuação de OSC"
- "Análise comparativa Norte-Nordeste"
- "Evolução temporal" (v2025 vs v2026)

#### 7.4 — Cruzamento de visões

- [ ] Análise integrada: estado X tem alta dimensão Y (Sociocultural) + baixa Z (Operacional)?
- [ ] Quadrantes: alta capacidade + alta vitalidade cultural = bons para indústria criativa
- [ ] Visualização específica para esse tipo de análise

#### 7.5 — Funcionalidades de comunidade

- [ ] Galeria pública de configurações compartilhadas (opt-in)
- [ ] Discussão metodológica via GitHub Discussions
- [ ] Política de citação clara

---

## Boas práticas e convenções

### Código

- **Coletores Python:** seguir PEP-8 + Black + Ruff
- **Frontend:** Prettier + ESLint
- **TypeScript** (quando migrarmos): strict mode obrigatório
- **Commits:** conventional commits (feat:, fix:, docs:, refactor:, etc.)
- **Branches:** `main` (produção/preview SWA), `feature/...`, `fix/...`

### Versionamento de dados

- Cada snapshot anual recebe versão (v2025, v2026, etc.)
- Versão antiga fica disponível via `?versao=v2025`
- Versão atual é default
- Changelog documentado em `data/CHANGELOG.md`

### Atualizações

- Coletores rodam manualmente no primeiro ano, depois cron mensal via GitHub Actions
- Antes de publicar nova versão: comparação com versão anterior, revisão manual
- Política de notificação: changelog visível na home

### Honestidade

- Toda mudança metodológica documentada
- Limitações sempre visíveis na interface
- Mudanças em scores de versão para versão: explicação obrigatória
- Erros assumidos publicamente

---

## Recursos úteis

### Documentação técnica

- [Azure Static Web Apps docs](https://learn.microsoft.com/azure/static-web-apps/)
- [Azure Functions Python developer guide](https://learn.microsoft.com/azure/azure-functions/functions-reference-python)
- [React docs](https://react.dev/)
- [Recharts gallery](https://recharts.org/en-US/examples)
- [IBGE API docs](https://servicodados.ibge.gov.br/api/docs/)

### Referências metodológicas

- OECD/JRC — Handbook on Constructing Composite Indicators
- Hofstede et al. (2010) — Comparing Regional Cultures Within a Country: Lessons From Brazil
- Prates & Barros (1997) — O Estilo Brasileiro de Administrar
- Manual UNDP Human Development Index Technical Notes

### Ferramentas

- Azure CLI / Azure MCP (já configurado no `.mcp.json`)
- Insomnia ou Bruno para testar APIs
- Excalidraw para diagramas
- GitHub Projects para gestão de sprints

---

## FAQ

**Por que Azure Functions e não backend Django ou Node?**
O frontend já está em Azure Static Web Apps com CI/CD configurado. Functions managed do SWA são gratuitas no plano Free, integram com o mesmo deploy, e suportam Python (linguagem dos coletores). Evita um segundo backend.

**Por que não fazer só uma SPA sem backend?**
Coleta de fontes externas é melhor agendada via Function/Action que num browser. Cache compartilhado entre usuários reduz carga nas APIs gov. URL compartilhável persistente exige storage do lado do servidor.

**Posso contribuir com proxies ou templates?**
Sim, via pull request com justificativa metodológica. Templates novos precisam: nome do caso de uso, público-alvo, pesos propostos com justificativa.

**Como citar?**
Citação automática gerada ao exportar análise (formato ABNT).

**O código vai ser aberto?**
Decisão pendente. Recomendação: sim, com licença permissiva. Contribui com transparência metodológica e adoção.
