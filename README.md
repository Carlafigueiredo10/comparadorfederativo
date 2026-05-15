# Comparador Federativo

Plataforma de Perfis Estaduais Configuráveis — análise multidimensional dos estados brasileiros com radar de dimensões socioculturais e operacionais, templates de caso de uso e score customizado.

Sprint atual: **5** (em transição — projeto Vite + deploy Azure pronto, expansão a 27 estados via APIs gov em andamento).

## Stack

- React 18 + Vite
- recharts (radar)
- Deploy: Azure Static Web Apps

## Rodar local

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

## Deploy Azure Static Web Apps

1. No portal Azure: criar um **Static Web App** apontando para este repo (branch `main`).
2. Azure gera automaticamente o token e adiciona em `Settings > Secrets > AZURE_STATIC_WEB_APPS_API_TOKEN` no GitHub.
3. O workflow [`.github/workflows/azure-static-web-apps.yml`](.github/workflows/azure-static-web-apps.yml) faz build e deploy em todo push para `main`.

Custo estimado: **gratuito no plano Free** do Static Web Apps (100 GB/mês de banda, SSL incluso, custom domain disponível).

## Estrutura

```
src/
  App.jsx          Componente principal (PerfisEstaduais)
  main.jsx         Entry point React
public/            Assets estáticos
staticwebapp.config.json   Routing SPA + headers
```

## Roadmap

- **Sprint 5** (em curso): expansão a 27 estados, ingestão das fontes oficiais (IBGE SIDRA, IPEA Data, TSE, INEP, SNIS, CNES, CGU, CNJ).
- **Sprint 6**: validação metodológica (PCA, leave-one-out, convergência externa).
- **Sprint 7**: URL compartilhável, exportação PDF/CSV, cruzamento de visões.

## Documentação

- [Roadmap completo](docs/roadmap.md) — visão estratégica e backlog de Sprints 8-12
- [Especificação técnica](docs/especificacao-tecnica.md) — arquitetura, contratos de API, modelo de dados
- [Guia de desenvolvimento](docs/guia-desenvolvimento.md) — sprints concretos, fontes de dados, passo a passo
