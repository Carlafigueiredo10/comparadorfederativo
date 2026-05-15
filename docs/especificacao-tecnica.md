# Especificação Técnica

> Arquitetura, stack, contratos de dados e decisões técnicas da Plataforma de Perfis Estaduais Configuráveis.

> **Nota:** revisão de Abril 2026 mudou o stack de produção de Django/Render para **Azure Functions + Static Web Apps**, alinhando com o repo atual. As decisões de modelagem de dados foram simplificadas para um modelo de snapshots em JSON versionado, com migração para banco relacional só se houver necessidade.

---

## Stack de produção

### Frontend
- **Framework:** React 18 + Vite
- **Linguagem:** JavaScript hoje, TypeScript planejado para a refatoração modular do Sprint 5
- **Bibliotecas:**
  - `recharts` (radar chart, já validado no protótipo)
  - State management: a definir conforme refatoração (provável `zustand` ou Context)
  - `react-router-dom` (rotas)
- **Compartilhamento de configuração:** URL querystring (base64-encoded JSON)

### Backend (API)
- **Plataforma:** Azure Functions (managed do Static Web App)
- **Linguagem:** Python 3.11+
- **Runtime:** Functions v4 com programming model v2
- **Cache:** in-memory dentro da Function (TTL longo, dados de leitura)

### Storage
- **Snapshots:** JSON versionado em `data/snapshots/v<ano>/<fonte>.json`, commitado no repo
- **Configurações compartilhadas (Sprint 7):** Azure Table Storage ou Cosmos quando necessário
- **Migração futura:** se transações ou queries complexas forem necessárias, considerar Postgres no Azure

### Hospedagem
- **Frontend + API:** Azure Static Web Apps (plano Free cobre o uso esperado)
- **CI/CD:** GitHub Actions já configurado em [`.github/workflows/azure-static-web-apps.yml`](../.github/workflows/azure-static-web-apps.yml)

### Coleta de dados (offline)
- **Linguagem:** Python 3.11+
- **Execução:** scripts standalone em `pipelines/`, rodados manualmente ou via GitHub Actions agendadas
- **Saída:** JSON em `data/snapshots/v<ano>/`

### Ferramentas de desenvolvimento
- **Versionamento:** Git + GitHub
- **Linting:** ESLint + Prettier (frontend), Ruff + Black (Python)
- **Testes:** Vitest + React Testing Library (frontend), Pytest (Python)
- **MCP:** Azure MCP configurado em [.mcp.json](../.mcp.json) para gestão de recursos

---

## Arquitetura geral

```
┌──────────────────────────────────────────────────────────────┐
│                          USUÁRIO                              │
└──────────────────────────────┬──────────────────────────────┘
                              │
              ┌───────────────▼──────────────┐
              │    Azure Static Web Apps     │
              │ ┌──────────────────────────┐ │
              │ │ Frontend (React/Vite)    │ │
              │ │ - Visualização (radar)   │ │
              │ │ - Configurador           │ │
              │ │ - Compartilhamento (URL) │ │
              │ └──────────────────────────┘ │
              │              │ /api/*        │
              │ ┌────────────▼─────────────┐ │
              │ │  Functions (Python 3.11) │ │
              │ │ - /api/states            │ │
              │ │ - /api/dimensoes         │ │
              │ │ - /api/scores            │ │
              │ │ - /api/templates         │ │
              │ │ - cache in-memory        │ │
              │ └────────────┬─────────────┘ │
              └──────────────┼───────────────┘
                             │
              ┌──────────────▼──────────────┐
              │  data/snapshots/v2026/      │
              │  - snis.json                │
              │  - cnes.json                │
              │  - inep.json                │
              │  - pnad.json                │
              │  ...                        │
              │  (commitado no repo)        │
              └──────────────▲──────────────┘
                             │
              ┌──────────────┴──────────────┐
              │  pipelines/ (Python)        │
              │  - coleta_snis.py           │
              │  - coleta_cnes.py           │
              │  - coleta_tse.py            │
              │  ...                        │
              │  (rodados local ou Action)  │
              └──────────────▲──────────────┘
                             │
              ┌──────────────┴──────────────┐
              │   Fontes externas           │
              │  IBGE, IPEA, SNIS, CNES,    │
              │  TSE, CNJ, CGU, BCB, INEP   │
              └─────────────────────────────┘
```

---

## Modelo de dados (JSON snapshots)

A spec original previa Postgres com tabelas relacionais (`states`, `proxies`, `dimensoes`, `proxy_valores`, `snapshots`, `templates`). Para Sprint 5 com Functions + storage estático, simplificamos para JSON versionado. A estrutura abaixo preserva a semântica das tabelas, organizada por arquivo.

### `data/states.json`

Catálogo fixo dos 27 estados (raramente muda).

```json
[
  {
    "sigla": "SP",
    "nome": "São Paulo",
    "regiao": "Sudeste",
    "populacao": 44400000,
    "cor_padrao": "#0F4C81"
  }
]
```

### `data/dimensoes.json`

Catálogo de dimensões e proxies (versionado em si — mudanças refletem evolução metodológica).

```json
[
  {
    "slug": "hierarquizacaoSocial",
    "label": "Hierarquização Social",
    "descricao": "...",
    "visao": "sociocultural",
    "origem": "Estrutural",
    "cor": "#0F4C81",
    "ordem_exibicao": 1,
    "proxies": [
      {
        "slug": "gini",
        "label": "Índice de Gini",
        "descricao": "Concentração de renda na população",
        "fonte": "PNAD 2024",
        "url_fonte": "https://...",
        "unidade": "",
        "inverter": false,
        "peso_na_dimensao": 50
      }
    ]
  }
]
```

### `data/snapshots/v2026/<fonte>.json`

Valores brutos coletados de cada fonte. Exemplo `snis.json`:

```json
{
  "fonte": "SNIS",
  "url_fonte": "http://snis.gov.br/...",
  "ano_referencia": 2024,
  "data_coleta": "2026-04-15T10:30:00Z",
  "is_estimativa": false,
  "valores": [
    {
      "uf": "SP",
      "indicadores": {
        "in055_atendimento_agua": 96.4,
        "in056_atendimento_esgoto": 92.1,
        "in046_esgoto_tratado": 78.3
      }
    }
  ]
}
```

### `data/snapshots/v2026/manifest.json`

Índice mestre da versão.

```json
{
  "versao": "v2026",
  "data_publicacao": "2026-05-01T00:00:00Z",
  "ativo": true,
  "changelog": "...",
  "fontes": ["snis", "cnes", "inep", "pnad", "tse", "cnj", "cgu"]
}
```

### `data/templates.json`

Templates de caso de uso.

```json
[
  {
    "slug": "telecentro",
    "label": "Implantação de telecentro",
    "descricao": "...",
    "publico_alvo": "Setor público — cultura/inclusão digital",
    "cor": "#7C3AED",
    "pesos": {
      "conectividadeDigital": 80,
      "capacidadeAcessoEstado": 70,
      "capitalEducacional": 60
    }
  }
]
```

---

## Contratos da API (Azure Functions)

Todas as Functions servidas em `/api/*` pelo Static Web App.

### `GET /api/states`

Retorna lista de estados disponíveis.

```json
[
  {
    "sigla": "SP",
    "nome": "São Paulo",
    "regiao": "Sudeste",
    "populacao": 44400000,
    "cor_padrao": "#0F4C81"
  }
]
```

### `GET /api/dimensoes`

Retorna todas as dimensões com seus proxies.

```json
[
  {
    "slug": "hierarquizacaoSocial",
    "label": "Hierarquização Social",
    "visao": "sociocultural",
    "origem": "Estrutural",
    "cor": "#0F4C81",
    "proxies": [
      {
        "slug": "gini",
        "label": "Índice de Gini",
        "fonte": "PNAD 2024",
        "is_real": true,
        "inverter": false,
        "unidade": ""
      }
    ]
  }
]
```

### `GET /api/scores?visao=sociocultural&versao=v2026`

Retorna scores normalizados de todas as dimensões para todos os estados.

```json
{
  "versao": "v2026",
  "visao": "sociocultural",
  "estados": {
    "SP": {
      "dimensoes": {
        "hierarquizacaoSocial": {
          "score_visual": 65,
          "proxies": {
            "gini": {"bruto": 0.51, "z": 0.42, "percentil": 75}
          }
        }
      }
    }
  }
}
```

### `POST /api/scores/customizado`

Calcula ranking customizado baseado em pesos.

**Request:**
```json
{
  "pesos": {
    "conectividadeDigital": 80,
    "capacidadeAcessoEstado": 70,
    "capitalEducacional": 60
  },
  "versao": "v2026"
}
```

**Response:**
```json
{
  "ranking": [
    {"sigla": "SP", "score": 78, "ranking": 1},
    {"sigla": "RS", "score": 72, "ranking": 2}
  ],
  "config_hash": "abc123"
}
```

### `GET /api/templates`

Retorna templates disponíveis.

### `POST /api/config/share` (Sprint 7)

Salva configuração e retorna URL compartilhável.

---

## Algoritmos de cálculo

### Z-score (normalização principal)

```python
def calcular_z_scores(valores: list[float]) -> list[float]:
    """Calcula z-score considerando os N estados como universo."""
    media = sum(valores) / len(valores)
    variancia = sum((v - media) ** 2 for v in valores) / len(valores)
    desvio = variancia ** 0.5
    if desvio == 0:
        return [0.0] * len(valores)
    return [(v - media) / desvio for v in valores]
```

### Conversão para escala visual 0-100

```python
def z_para_escala_visual(z: float) -> float:
    """Mapeia z (-2 a +2) para 0-100, com z=0 → 50."""
    return max(0, min(100, 50 + (z * 25)))
```

### Percentil (ranking)

```python
def calcular_percentis(valores: list[float]) -> list[float]:
    """Percentil baseado em ranking (1 a n → 0 a 100)."""
    indexed = sorted(enumerate(valores), key=lambda x: x[1])
    percentis = [0.0] * len(valores)
    for rank, (idx, _) in enumerate(indexed):
        percentis[idx] = (rank / (len(valores) - 1)) * 100 if len(valores) > 1 else 50
    return percentis
```

### Score customizado (média ponderada)

```python
def score_customizado(
    pesos: dict[str, int],          # {dimensao_slug: peso_0_100}
    scores_dimensoes: dict[str, float]  # {dimensao_slug: score_0_100}
) -> float:
    """Calcula score agregado ponderado."""
    ativas = {d: p for d, p in pesos.items() if p > 0}
    if not ativas:
        return 0.0
    soma_pesos = sum(ativas.values())
    soma_scores = sum(scores_dimensoes[d] * p for d, p in ativas.items())
    return round(soma_scores / soma_pesos, 1)
```

### Correlação de Pearson (para diagnóstico de colinearidade)

```python
def correlacao_pearson(x: list[float], y: list[float]) -> float:
    """Correlação para diagnóstico de redundância entre proxies."""
    n = len(x)
    mx = sum(x) / n
    my = sum(y) / n
    num = sum((x[i] - mx) * (y[i] - my) for i in range(n))
    den_x = sum((x[i] - mx) ** 2 for i in range(n)) ** 0.5
    den_y = sum((y[i] - my) ** 2 for i in range(n)) ** 0.5
    den = den_x * den_y
    return num / den if den > 0 else 0.0
```

---

## Pipeline de coleta de dados

Cada fonte tem um script Python independente em `pipelines/`. Saída: JSON em `data/snapshots/v<ano>/`.

### Estrutura padrão de um coletor

```python
# pipelines/coleta_snis.py

import json
import requests
from datetime import datetime, timezone
from pathlib import Path

SNAPSHOT_DIR = Path(__file__).parent.parent / "data" / "snapshots" / "v2026"

def coletar_snis_saneamento(ano: int = 2024) -> dict:
    """Coleta indicadores SNIS por UF para o ano especificado."""
    # 1. Download dos CSVs do SNIS (ou da API consolidada)
    valores_por_uf = baixar_e_agregar_snis(ano)

    # 2. Estruturar saída
    snapshot = {
        "fonte": "SNIS",
        "url_fonte": "http://snis.gov.br/diagnostico-anual",
        "ano_referencia": ano,
        "data_coleta": datetime.now(timezone.utc).isoformat(),
        "is_estimativa": False,
        "valores": valores_por_uf,
    }

    # 3. Persistência
    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = SNAPSHOT_DIR / "snis.json"
    output_path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2))

    print(f"SNIS {ano}: {len(valores_por_uf)} UFs salvos em {output_path}")
    return snapshot

if __name__ == "__main__":
    coletar_snis_saneamento(2024)
```

### Cronograma de coleta

| Fonte | Frequência | Mês ideal de coleta |
|---|---|---|
| IBGE PNAD | Anual | Março (dados do ano anterior) |
| IBGE Censo | Decenal | Sob demanda |
| IPEAdata | Mensal/anual | Conforme disponibilidade |
| SNIS Saneamento | Anual | Dezembro |
| CNES Saúde | Mensal | Janeiro (snapshot do ano anterior) |
| INEP IDEB | Bienal | Setembro |
| TSE Eleições | Por pleito | Após cada eleição |
| CNJ Justiça em Números | Anual | Maio |
| CGU EBT | Anual | Conforme publicação |
| PNAD TIC | Anual | Conforme publicação |

---

## Decisões técnicas específicas

### Por que Azure Functions e não Django?

- Frontend já está em Azure SWA com CI/CD configurado — Functions managed integram no mesmo deploy
- Plano Free do SWA cobre o uso esperado (sem custo)
- Para esse caso (API read-mostly + coletores periódicos), serverless é adequado e elimina gestão de servidor
- Python permanece como linguagem (mesma dos coletores)

### Por que JSON em arquivo e não Postgres?

- Volume é pequeno (27 estados × ~30 proxies × N anos = milhares de linhas, não milhões)
- Dados são read-mostly e versionáveis — Git resolve versionamento naturalmente
- Sem escrita transacional de usuário no Sprint 5 (chega no Sprint 7 com configurações compartilhadas, aí sim Table/Cosmos)
- Facilita reproducibilidade: snapshot é arquivo, não dump de banco

### Por que React + Vite?

- Vite tem build muito mais rápido que CRA
- Já configurado no projeto
- TypeScript pode ser introduzido incrementalmente (planejado na refatoração modular)
- Interatividade do radar e sliders precisa SPA — server-rendered seria pior

### Como lidar com dados estimados vs. reais

- Campo `is_estimativa` no snapshot por fonte
- Frontend mostra badge verde "✓" para `is_estimativa = false`
- Estratégia: começar com estimativas calibradas, substituir gradualmente
- Quando substituir: marcar `is_estimativa = false` no novo snapshot, manter histórico em snapshot da versão anterior

### URL compartilhável de configuração

Estratégia simples (Sprint 4 já implementado parcialmente):
```javascript
// Encode
const config = { pesos, selecionados };
const hash = btoa(JSON.stringify(config));
const url = `https://app.azurestaticapps.net/share?c=${hash}`;

// Decode
const config = JSON.parse(atob(searchParams.get('c')));
```

Para configurações muito longas (>2KB), usar endpoint `/api/config/share` (Sprint 7) que persiste em Table Storage e retorna hash curto.

---

## Limitações técnicas conhecidas

1. **Cálculo de z-score recalcula em cada request** — cacheável in-memory na Function (TTL longo)
2. **Sem versionamento de templates** — se um template é editado, configurações antigas que usavam ele "perdem" o vínculo
3. **Sem autenticação no Sprint 5** — adicionar antes de feature de "Salvar minhas configurações" (SWA suporta auth integrada com GitHub/AAD)
4. **Sem rate limiting** — adicionar via Azure API Management se necessário, ou throttling simples na Function
5. **Sem internacionalização** — interface só em pt-BR (correto pro escopo)

---

## Testes mínimos antes de produção

### Backend (Functions)
- [ ] Teste unitário de cada algoritmo (z-score, percentil, score customizado)
- [ ] Teste de integração de cada pipeline de coleta com mock de resposta
- [ ] Teste de contrato de API (endpoints respondem o schema esperado)
- [ ] Teste de versionamento (snapshot v1 e v2 coexistem)

### Frontend
- [ ] Renderização do radar com diferentes números de dimensões (3, 7, 15)
- [ ] Cálculo correto de pesos normalizados (devem sempre somar 100%)
- [ ] Aplicação de templates preenche sliders corretamente
- [ ] URL compartilhável reproduz configuração ao abrir
- [ ] Empty state aparece quando < 3 dimensões selecionadas

### Validação metodológica (Sprint 6)
- [ ] PCA sobre 27 estados × 15 dimensões — qual % da variância no primeiro componente?
- [ ] Leave-one-state-out: scores são estáveis?
- [ ] Correlação convergente com IDH, IDEB, Gini (variáveis externas)

---

## Considerações de segurança

- **Autenticação:** quando precisar (Sprint 7+), usar Auth integrada do SWA (GitHub, AAD, Twitter)
- **Rate limiting:** Functions managed têm limites próprios; throttling adicional via APIM se necessário
- **CORS:** configurado em `staticwebapp.config.json` (mesmo origin já é o caso)
- **Validação de input:** todos os endpoints validam tipos e ranges (pesos 0-100, etc.)
- **Audit log:** registrar configurações compartilhadas com IP/timestamp (LGPD-friendly: minimizar PII)
- **HTTPS obrigatório** — SWA já força por default
- **Headers de segurança:** CSP, X-Frame-Options, X-Content-Type-Options via `staticwebapp.config.json`

---

## Próximos passos imediatos

1. Criar pasta `api/` com primeira Azure Function (SNIS) — ver Guia de Desenvolvimento Sprint 5
2. Criar `data/snapshots/v2026/` com primeiro coletor SNIS rodado
3. Refatorar `App.jsx` em componentes modulares
4. Cobrir 27 estados nesse primeiro pipeline antes de partir para o segundo

Ver [Guia de Desenvolvimento](./guia-desenvolvimento.md) para detalhamento de cada passo.
