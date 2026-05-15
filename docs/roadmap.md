# Roadmap — Plataforma de Perfis Estaduais Configuráveis

**Última atualização:** Abril 2026
**Status:** Sprint 4 entregue · Sprint 5 em curso · Sprints 6-7 em planejamento

---

## Posicionamento estratégico (revisado)

### O que mudou

Até agora tratamos "dimensão" como **fim**: quanto mais dimensões, melhor a ferramenta.

A virada: **dimensão é meio**. O fim é permitir que cada decisor escolha o que importa para a decisão dele.

### Implicação prática

Não somos mais um "Índice de Perfis Estaduais" (produto fechado, opinião nossa sobre o que importa).

Somos uma **Plataforma de Avaliação Estadual Configurável** (infraestrutura aberta, opinião do decisor sobre o que importa).

### O que isso muda

| Antes | Depois |
|---|---|
| "Aqui estão as 5 dimensões da Visão Sociocultural" | "Aqui estão as dimensões disponíveis — selecione as relevantes" |
| "O score agrega tudo com pesos iguais" | "Você define quais dimensões entram e com que peso" |
| Comparação fixa entre estados | Comparação personalizada por caso de uso |
| Uma visão por vez | Mix de dimensões de múltiplas visões num mesmo radar |

### Por que isso é o diferencial real

Ferramentas de comparação cultural existem (Culture Factor, Hofstede Insights). Ferramentas de comparação operacional existem (Atlas IPEA, FIRJAN, IBGE Cidades). **Ferramenta que permite configurar a avaliação por caso de uso, com transparência metodológica completa, não existe.**

Esse é o produto que vale construir.

---

## Princípios que guiam o roadmap

1. **Profundidade antes de largura** — uma plataforma com 2 visões muito robustas vence uma com 5 superficiais.
2. **Configurabilidade sobre opinião fechada** — o decisor sabe o que importa pra ele melhor que nós.
3. **Transparência metodológica radical** — todos os proxies, fontes, limitações sempre visíveis.
4. **Dado oficial real sempre que possível** — estimativas só como ponte temporária até a expansão.
5. **Validação antes de expansão** — não adicionar mais coisa antes de validar o que já tem.

---

## Sprint 3 — Completar a base de dimensões (concluído)

**Objetivo:** Fechar as duas visões atuais com as dimensões que faltam, antes de qualquer expansão geográfica.

### Sociocultural — adições

**Participação Cívica** (nova, prioridade alta)
- Proxies: comparecimento eleitoral (TSE), densidade de associações sem fins lucrativos (IBGE FASFIL/Munic), atividade de conselhos municipais
- Por que: lacuna evidente no framework atual — engajamento coletivo organizado é distinto de configuração de vínculos e de vitalidade cultural.
- Status dos dados: TSE tem comparecimento por estado e eleição com API; FASFIL tem dado consolidado por UF.

**Confiança Institucional** (com ressalva)
- Proxies: judicialização per capita (CNJ Justiça em Números), uso de canais formais de denúncia, satisfação com serviços públicos (PNAD/Latinobarômetro Brasil)
- Ressalva metodológica: judicialização é proxy ambíguo (alta judicialização pode indicar confiança ou conflito). Documentar isso explicitamente; talvez usar judicialização **excluindo** ações de saúde e previdência (que distorcem).
- Por que entra com ressalva: dimensão importante mas operacionalização frágil.

### Operacional — adições

**Capacidade de Acesso ao Estado** (nova, prioridade alta)
- Proxies: densidade de agências do INSS, presença municipal de unidades do CRAS/CREAS, cobertura de cartórios civis, presença de Defensoria Pública estadual, agências do Banco do Brasil/CEF (rede de pagamento de benefícios)
- Por que: complementa "Cobertura Previdenciária" com dimensão territorial — não basta a pessoa ter direito, ela precisa ter onde acessar. Crítico no Norte e Nordeste interior.
- Distinção: Cobertura Previdenciária mede **quem tem** (PNAD); Capacidade de Acesso mede **onde dá pra acessar** (georreferenciamento).
- Fontes: Anuário Estatístico da Previdência, MDS/CadSUAS, CNJ corregedoria, BCB-Sisbacen.

### Resultado do Sprint 3

- Sociocultural: 5 → 7 dimensões (adiciona Participação Cívica + Confiança Institucional)
- Operacional: 7 → 8 dimensões (adiciona Capacidade de Acesso ao Estado)
- Total: 15 dimensões empíricas com proxies oficiais

---

## Sprint 4 — Configurabilidade (a virada estratégica) — concluído

**Objetivo:** Transformar a ferramenta de "índice fechado" em "plataforma configurável".

### O que mudou na UI

**Modo "Análise Configurada"** (novo, padrão para usuários avançados)

```
┌────────────────────────────────────────────────────────┐
│ Configure sua análise:                                 │
│                                                        │
│ ☑ Hierarquização Social        [peso ──────  30%]     │
│ ☑ Configuração de Vínculos                             │
│ ☑ Conectividade Digital        [peso ──────  20%]     │
│ ☑ Cobertura de Saúde           [peso ──────  35%]     │
│ ☑ Capacidade de Acesso         [peso ──────  15%]     │
│ ☐ Vitalidade Cultural                                 │
│ ☐ ...                                                  │
│                                                        │
│ [▶ Calcular ranking customizado]                       │
└────────────────────────────────────────────────────────┘
```

**Modo "Visão Pré-Configurada"** (mantido para uso rápido)
- Visão Sociocultural completa (todas as dimensões, pesos iguais)
- Visão Operacional completa
- **Templates de caso de uso** (novo): "Implantação de telecentro", "Expansão de varejo digital", "Política de economia criativa", "Localização de centro de distribuição"
  - Cada template = combinação pré-definida de dimensões + pesos sugeridos
  - Usuário pode partir do template e customizar

### Implicações técnicas

- Sistema de pesos com slider (não só 0-1, mas com normalização)
- Salvar configurações personalizadas (URL compartilhável)
- Análise de sensibilidade automática: "se você variar este peso de 20% a 40%, o ranking muda assim"
- Exportação de resultados (PDF, CSV)

### Por que esse sprint foi o mais importante

**Antes do Sprint 4**, a ferramenta era "mais um índice". **Depois do Sprint 4**, a ferramenta é uma **categoria nova** — comparador estadual configurável. Isso é o que justifica o trabalho.

---

## Sprint 5 — Expansão geográfica (27 estados) — em curso

**Objetivo:** Sair do piloto de 5 estados e ter dado real pra todos os 27.

### Por que só agora

Você está se perguntando: "por que expansão pros 27 estados não é prioridade 1?"

Resposta: porque expansão sem ter a estrutura conceitual fechada (Sprint 3) e sem ter o diferencial estratégico implementado (Sprint 4) só multiplica problema por 27. Melhor expandir uma plataforma boa do que um índice frágil.

### Implementação

- Pipeline de coleta automatizada via APIs:
  - IBGE SIDRA (PNAD, Censo, Estatísticas de Gênero)
  - IPEAdata (séries consolidadas)
  - SNIS/SINISA (saneamento)
  - CNES (saúde)
  - INEP (educação)
  - CGI.br/Cetic (TIC Domicílios — não tem API pública, scraping autorizado)
  - TSE (eleitoral)
  - CNJ (justiça)
  - CGU (transparência)
- Política de atualização: anual, com versionamento (v2024, v2025...)
- Dados estimados → substituição por dados reais

### Stack escolhida (revisão de Abril 2026)

A spec original previa Django + Render. Decisão revisada: **Azure Functions (Python) + Static Web Apps**. Razões:
- Frontend já está em SWA com CI/CD configurado
- Functions servem coletores como endpoints HTTP triggered ou timer triggered
- Plano gratuito do SWA cobre o uso esperado nesse estágio
- MCP Azure já configurado no repo facilita gestão de recursos

### Resultado esperado

- 27 estados × 15 dimensões = 405 cells de dado, ~80% com fonte real
- Atualização anual automatizada
- Dado fica útil pra valer

---

## Sprint 6 — Validação metodológica formal

**Objetivo:** Sair do "plausível" e chegar no "validado".

### Testes a executar

**1. Análise de componentes principais (PCA)**
Confirmar/descartar a hipótese da auditoria de que tudo cai num eixo único. Com 27 estados, PCA fica estatisticamente significativo. Se confirmar, **reduzir dimensões redundantes**; se descartar, **defender as dimensões com base empírica**.

**2. Validação convergente externa**
Testar correlação das dimensões com variáveis independentes não usadas no índice:
- Dimensões socioculturais → comparecimento eleitoral, sobrevivência empresarial, taxa de associativismo
- Dimensões operacionais → atração de investimentos, IDH, expectativa de vida

Se uma dimensão não correlaciona com nenhuma variável externa relevante, **ela não está medindo nada útil** e deve sair.

**3. Análise de sensibilidade**
- Leave-one-proxy-out: o ranking muda muito se eu tirar um proxy?
- Leave-one-state-out: o z-score dos outros é estável?
- Pesos alternativos: PCA-derivados vs. iguais vs. especialista vs. configurado pelo usuário

**4. Estabilidade temporal**
Comparar v2024 com v2025 quando disponível. Mudanças bruscas em scores estaduais sem mudança de realidade = índice instável.

### Resultado esperado

- Documento metodológico técnico publicável
- Possível redução de dimensões (se PCA mostrar redundância)
- Pesos defensáveis baseados em dado, não em achismo
- Credibilidade acadêmica

---

## Sprint 7 — Cruzamento de visões e templates de caso de uso

**Objetivo:** Realizar o potencial real da ferramenta — análises integradas.

### Funcionalidades

**1. Cruzamento entre visões**

Hoje as duas visões são silos. No Sprint 7, dá pra fazer perguntas como:
- "Estados com alta Vitalidade Cultural + alta Conectividade Digital" → bom para indústria criativa digital
- "Estados com baixa Capacidade de Acesso + alta Hierarquização Social" → prioridade para descentralização de serviços
- "Estados com alta Capacidade Estatal + baixa Cobertura de Saúde" → recursos sem implementação

**2. Templates expandidos de caso de uso**

Templates pré-configurados para casos comuns:
- **Setor público**: "Onde implantar [serviço X]?", "Onde reforçar [política Y]?"
- **Empresas privadas**: "Onde abrir filiais?", "Onde testar produto Z?"
- **Pesquisa**: "Comparação Norte vs. Nordeste", "Evolução temporal"
- **Terceiro setor**: "Onde focar atuação?", "Onde tem demanda não atendida?"

**3. Exportação e compartilhamento**

- Relatórios em PDF com configuração + resultados + metodologia
- URL compartilhável para reproduzir análise específica
- API pública (read-only) para uso em outras ferramentas

### Por que esse sprint é o último (por enquanto)

Aqui o produto está completo o suficiente para uso real. Próximas evoluções dependem de feedback de uso, não de planejamento.

---

## Mapa visual da evolução

### Roadmap comprometido (Sprints 3-7)

```
Sprint 3              Sprint 4              Sprint 5            Sprint 6              Sprint 7
───────────           ───────────           ───────────         ───────────           ───────────
Mesmas 2 visões       Configurabilidade     27 estados          Validação formal      Cruzamentos
+3 dimensões          + templates           dados reais         redução possível      e templates
                                                                                       avançados

[base completa]       [virada estratégica]  [escala]            [credibilidade]       [produto pronto]
[CONCLUÍDO]           [CONCLUÍDO]           [EM CURSO]          [PLANEJADO]           [PLANEJADO]
```

### Backlog de evolução futura (gatilho-dependente)

```
Sprint 8a/8b          Sprint 9              Sprint 10             Sprint 11           Sprint 12
───────────           ───────────           ───────────           ───────────         ───────────
Sustentabilidade      Visão Inovação        Visão Sustent.        Visão Mercado       Diversidade
e Mercado como        e Conhecimento        ambiental aprofund.   e Consumo           étnico-racial
dimensões da
Operacional

[demanda → dado]      [demanda C&T]         [se 8a insuficiente]  [demanda privada]   [parceria + ética]
```

---

## O que NÃO está no roadmap atual (mas pode entrar no futuro)

Esta seção lista expansões **conscientemente adiadas** para depois do Sprint 7. Não são compromissos — são possibilidades com gatilhos claros de ativação. A regra é: só ativar se houver **demanda concreta** ou se a validação do Sprint 6 mostrar lacuna específica.

### Backlog de Evolução Futura (pós-Sprint 7)

#### Sprint 8a — Sustentabilidade Ambiental (como dimensão da Operacional)

**Gatilho de ativação:** demanda concreta de caso de uso ESG/financiamento verde, OU expansão de templates do Sprint 7 que precise de proxies ambientais.

**Proxies candidatos:**
- Cobertura vegetal nativa e desmatamento (MapBiomas — referência mundial, dado por estado)
- Qualidade do ar em áreas urbanas (INPE/INMET)
- Gestão de resíduos sólidos (SNIS-RS)
- Cobertura de coleta de lixo (IBGE)

**Por que entra como dimensão da Operacional, não visão separada:** evita duplicação. Sustentabilidade ambiental afeta decisões de implantação tanto quanto saneamento e conectividade — pertence ao mesmo eixo "capacidade do território".

**Esforço estimado:** baixo. MapBiomas tem API e dado consolidado por UF.

---

#### Sprint 8b — Mercado Consumidor (como dimensão da Operacional)

**Gatilho de ativação:** uso significativo da ferramenta por empresas privadas (medido via templates do Sprint 7), OU pedido explícito de parceria com setor privado.

**Proxies candidatos:**
- PIB per capita (IBGE Contas Regionais)
- Massa salarial formal (RAIS)
- Renda média domiciliar (PNAD)
- Bancarização e uso de crédito (BCB)

**Por que entra como dimensão da Operacional:** poder de compra é capacidade do território para sustentar serviços/produtos. Não merece visão própria — duplicaria com Capacidade Estatal e Cobertura Previdenciária.

**Cuidado metodológico:** correlação altíssima esperada com outras dimensões operacionais (especialmente Capacidade Estatal). Antes de adicionar, rodar PCA do Sprint 6 — pode ser que essa dimensão saia redundante.

**Esforço estimado:** baixo. Dados todos com APIs.

---

#### Sprint 9 — Visão 3: Inovação e Economia do Conhecimento

**Gatilho de ativação:** demanda formal de órgão de C&T (MCTI, FAP, parque tecnológico), OU documentação de pelo menos 3 casos de uso reais que precisem dessa visão.

**Dimensões candidatas:**
- Investimento em P&D público e privado (MCTI)
- Densidade de pesquisadores e bolsistas (CNPq, CAPES)
- Pedidos de patente e propriedade intelectual (INPI)
- Ecossistema de startups (ABStartups, Distrito.me)
- Formação técnica e profissional (INEP, SENAI)

**Por que esperar:** nicho específico, baixa demanda comparada a Sociocultural/Operacional. Construir antes de validar demanda é overengineering — mesmo erro que evitamos com Prates-Barros.

**Esforço estimado:** médio. Dados existem mas estão dispersos em fontes diferentes.

---

#### Sprint 10 — Visão 4: Sustentabilidade Ambiental Aprofundada

**Gatilho de ativação:** se Sustentabilidade entrar como dimensão (8a) e provar ter mais discriminação que outras dimensões operacionais — OU se houver projeto ESG concreto que precise de profundidade ambiental.

**Diferença para 8a:** o 8a entra como uma dimensão dentro de Operacional. O 10 promove a **visão separada** com 5-6 dimensões ambientais profundas:
- Mudança climática (emissões, vulnerabilidade)
- Biodiversidade (índices MapBiomas)
- Água (ANA, qualidade e disponibilidade)
- Energia limpa (matriz elétrica estadual, ONS)
- Resíduos e economia circular
- Adaptação climática

**Por que esperar:** só faz sentido se a dimensão de 8a se mostrar insuficiente. Construir visão ambiental completa antes de validar é apostar.

---

#### Sprint 11 — Visão 5: Mercado e Consumo

**Gatilho de ativação:** se o uso por setor privado se consolidar (Sprint 8b ativado e bem usado) E se templates de varejo/expansão comercial se mostrarem insuficientes só com a dimensão de Mercado Consumidor.

**Dimensões candidatas:**
- Poder de compra (PIB, massa salarial, renda)
- Perfil etário e bônus demográfico (IBGE Demografia)
- Comportamento digital (TIC Domicílios — cruzamento com Conectividade)
- Hábitos de consumo (POF — desagregação por categoria)
- E-commerce e fintechs (BCB, ABComm)

**Cuidado conceitual importante:** Visão 5 mais que as outras corre risco de virar "ferramenta de marketing" em vez de "ferramenta de análise territorial". Precisa enquadramento ético: dados públicos para entender território, não para segmentação predatória.

---

#### Sprint 12 — Diversidade Étnico-Racial e Cultural

**Gatilho de ativação:** demanda concreta de órgão de promoção de igualdade racial, OU projeto de pesquisa acadêmica com enquadramento ético robusto, OU equipe ampliada com competência específica nesse campo.

**Por que está aqui e não foi descartada:** a dimensão é importante e o Brasil tem dados oficiais robustos (Censo, IBGE Cor ou Raça). O motivo de não fazer agora é capacidade de fazer **bem**, não desinteresse.

**Riscos a mitigar antes de implementar:**
- Risco de essencialização ("estado X é assim porque tem mais Y")
- Risco de instrumentalização para discurso anti-cota ou anti-políticas afirmativas
- Risco de simplificar identidade cultural a composição populacional

**Pré-requisitos para ativar:**
- Consultar pesquisadores de relações étnico-raciais antes de definir proxies
- Enquadramento explícito: a dimensão **descreve composição populacional**, não atribui características culturais a grupos
- Sempre apresentada junto com indicadores de desigualdade racial (não só composição)
- Documento de uso ético publicado junto

**Proxies candidatos (se ativado):**
- Composição racial (Censo)
- Presença indígena, quilombola, comunidades tradicionais (FUNAI, Fundação Cultural Palmares)
- Diversidade migratória (IBGE migração internacional)
- Indicadores de desigualdade racial (renda, educação, mortalidade — PNAD)

---

### Princípio orientador do backlog futuro

**Não construir antecipando demanda. Construir respondendo a demanda real.**

A história do projeto até aqui mostra que cada vez que adicionamos algo "porque seria interessante", a auditoria metodológica veio depois cobrar. Agora seguimos a regra inversa: **demanda concreta + dado disponível + gatilho documentado = ativar**. Sem os três, fica no backlog.

---

### O que continua descartado (não está no backlog)

Diferente do backlog acima, estas decisões são mais difíceis de reverter porque os problemas são metodológicos ou de escopo, não de prioridade:

- **Camada Prates-Barros completa** — proxies oficiais frágeis para a maioria dos 9 traços (personalismo, jeitinho, paternalismo). Forçar operacionalização ruim de conceitos importantes faz pior do que não ter. Pode entrar **traço por traço** se proxy oficial robusto aparecer (ex: judicialização para formalismo, já implementada via Confiança Institucional).
- **Pesquisa primária (VSM ou survey)** — caro, fora do escopo de ferramenta atualizável anualmente. Reverter exigiria mudança radical de modelo.
- **Comparação com países** — não é o propósito da ferramenta. Existe outras (Culture Factor, Hofstede Insights). Foco é Brasil subnacional.

---

## Critérios de sucesso por sprint

| Sprint | Critério de sucesso |
|---|---|
| 3 | 15 dimensões implementadas com proxies declarados |
| 4 | Usuário consegue configurar análise customizada e compartilhar URL |
| 5 | 80% dos dados são reais (não estimativa) para os 27 estados |
| 6 | Documento técnico de validação metodológica publicado |
| 7 | Pelo menos 5 templates de caso de uso prontos e testados |

---

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Sprint 4 (configurabilidade) é grande — pode atrasar tudo | Quebrar em Sprint 4a (toggle de dimensões) e Sprint 4b (pesos + templates) |
| Sprint 6 (validação) pode revelar que dimensões precisam sair | Ótimo — é exatamente o que validação serve. Embutir no design que isso pode acontecer. |
| APIs podem mudar/quebrar entre Sprints 5 e 6 | Manter cache de dados anuais; falha de API não derruba ferramenta |
| Configurabilidade pode confundir usuário leigo | Modo "Visão Pré-Configurada" continua sendo o padrão para entrada |
| Plataforma pode virar "tudo para todos" | Manter foco: 2 visões, dimensões empíricas, transparência metodológica |

---

## Resumo executivo

A ferramenta deixa de ser um índice e passa a ser uma plataforma. O valor está em **permitir configuração**, não em ter mais dimensões. As próximas adições (Participação Cívica, Confiança Institucional, Capacidade de Acesso) fecham a base. A configurabilidade (Sprint 4) é a virada estratégica que justifica o projeto. A expansão (Sprint 5) e a validação (Sprint 6) consolidam credibilidade. O cruzamento (Sprint 7) entrega valor analítico real.

Decisão consciente: **profundidade sobre largura**. 2 visões, 15-18 dimensões, configurabilidade total, transparência radical.

**Sobre evolução futura:** o backlog (Sprints 8-12) lista possibilidades de expansão temática (Sustentabilidade, Mercado, Inovação, Diversidade) com gatilhos de ativação claros. Nenhuma é compromisso — só ativam se houver demanda concreta + dado disponível. Esta disciplina protege o projeto de crescer mais do que pode sustentar bem.
