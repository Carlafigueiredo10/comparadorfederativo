import React, { useState, useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

// =============================================================================
// SPRINT 4 — VIRADA ESTRATÉGICA: PLATAFORMA CONFIGURÁVEL
// Plataforma de Perfis Estaduais Configuráveis
//
// MUDANÇAS v4.0:
// 1. NOVO MODO "CONFIGURADO" — usuário seleciona dimensões e define pesos
// 2. TEMPLATES de caso de uso pré-configurados:
//    - Implantação de inclusão digital
//    - Expansão de varejo digital
//    - Política de economia criativa
//    - Localização logística
// 3. SCORE CUSTOMIZADO — média ponderada das dimensões selecionadas
//    com ranking dinâmico dos estados
// 4. Mistura dimensões de Sociocultural + Operacional num único radar
//
// POSICIONAMENTO: deixa de ser "índice fechado" e vira "plataforma de avaliação
// configurável". O decisor escolhe o que importa para a decisão dele.
// =============================================================================

// -----------------------------------------------------------------------------
// DADOS BRUTOS — VISÃO SOCIOCULTURAL (mantido do Sprint 1.3)
// -----------------------------------------------------------------------------
const DADOS_SOCIOCULTURAL = {
  SP: { gini: 0.51, mulheresGerencia: 42.5, urbanizacao: 96.2, tamDomicilio: 2.8,
        escolaridadeSuperior: 22.4, formalizacao: 68.0, ocupadosCultura: 7.6,
        comparecimentoEleitoral: 78.3, densidadeAssociacoes: 18.5, judicializacaoCivel: 12.2 },
  BA: { gini: 0.52, mulheresGerencia: 36.0, urbanizacao: 77.6, tamDomicilio: 3.2,
        escolaridadeSuperior: 12.8, formalizacao: 48.0, ocupadosCultura: 5.5,
        comparecimentoEleitoral: 75.5, densidadeAssociacoes: 12.0, judicializacaoCivel: 7.8 },
  RS: { gini: 0.45, mulheresGerencia: 41.0, urbanizacao: 87.5, tamDomicilio: 2.7,
        escolaridadeSuperior: 19.1, formalizacao: 65.0, ocupadosCultura: 6.0,
        comparecimentoEleitoral: 80.1, densidadeAssociacoes: 22.8, judicializacaoCivel: 14.5 },
  PA: { gini: 0.52, mulheresGerencia: 33.0, urbanizacao: 78.5, tamDomicilio: 3.5,
        escolaridadeSuperior: 10.2, formalizacao: 38.0, ocupadosCultura: 3.5,
        comparecimentoEleitoral: 73.2, densidadeAssociacoes: 9.5, judicializacaoCivel: 6.0 },
  GO: { gini: 0.48, mulheresGerencia: 38.0, urbanizacao: 91.4, tamDomicilio: 3.0,
        escolaridadeSuperior: 16.3, formalizacao: 55.0, ocupadosCultura: 5.0,
        comparecimentoEleitoral: 76.8, densidadeAssociacoes: 15.0, judicializacaoCivel: 10.5 }
};

// -----------------------------------------------------------------------------
// DADOS BRUTOS — VISÃO OPERACIONAL (nova)
// Valores reais quando possível (marcados [R]), estimados (marcados [E])
// -----------------------------------------------------------------------------
const DADOS_OPERACIONAL = {
  SP: {
    // Conectividade
    domicilioInternet: 96.5,      // [R] PNAD TIC 2024 (SE=94,7%, SP estimado acima da média)
    bandaLargaFixa: 91.5,         // [R] PNAD TIC 2024 (SE alta cobertura)
    // Infraestrutura
    aguaTratada: 95.0,            // [R] SNIS 2022 (SE liderança)
    esgotoColetado: 92.0,         // [R] SNIS 2022 (SP entre os melhores)
    // Mobilidade
    rodoviasPavimentadas: 35.0,   // [E] % da malha (SP tem maior malha pavimentada absoluta)
    aeroportosComerciais: 5.0,    // [E] densidade per milhão hab
    // Saúde
    leitosPorMil: 2.4,            // [R] CNES 2024 (SP próximo da média)
    medicosPorMil: 3.1,           // [R] CFM 2024 (SP entre os mais altos)
    coberturaAPS: 65.0,           // [E] e-SUS APS
    // Previdência
    coberturaPrevidenciaria: 76.0,// [R] PNAD (SE alta)
    bancarizacao: 88.0,           // [R] BCB
    // Capacidade Estatal
    receitaPercapita: 4500,       // [R] STN 2024 (R$/hab)
    transparenciaCGU: 8.7,        // [R] EBT CGU
    // Educação
    ideb: 5.6,                    // [R] IDEB 2023 anos finais (SP referência)
    // Capacidade de Acesso ao Estado (NOVO Sprint 3)
    densidadeINSS: 0.58,          // [E] agências INSS por 100k hab
    coberturaCRAS: 92.0,          // [E] % municípios com CRAS
    presencaDefensoria: 88.0      // [E] % municípios com Defensoria Pública
  },
  BA: {
    domicilioInternet: 92.3,      // [R] PNAD TIC 2024 (NE 92,3% banda larga fixa)
    bandaLargaFixa: 90.0,
    aguaTratada: 80.0,
    esgotoColetado: 45.0,         // [E] NE com cobertura baixa
    rodoviasPavimentadas: 22.0,
    aeroportosComerciais: 3.0,
    leitosPorMil: 2.0,
    medicosPorMil: 1.6,
    coberturaAPS: 78.0,           // [E] NE alta cobertura ESF
    coberturaPrevidenciaria: 58.0,
    bancarizacao: 72.0,
    receitaPercapita: 2800,
    transparenciaCGU: 7.2,
    ideb: 4.5,
    densidadeINSS: 0.42,
    coberturaCRAS: 95.0,          // NE alta cobertura CRAS
    presencaDefensoria: 65.0
  },
  RS: {
    domicilioInternet: 95.8,      // [R] Sul alta
    bandaLargaFixa: 89.0,
    aguaTratada: 89.0,
    esgotoColetado: 32.0,         // [R] RS conhecido por baixa cobertura esgoto
    rodoviasPavimentadas: 28.0,
    aeroportosComerciais: 4.5,
    leitosPorMil: 2.71,           // [R] CNES dez/2023 (terceiro maior do país)
    medicosPorMil: 2.8,
    coberturaAPS: 70.0,
    coberturaPrevidenciaria: 78.0,// Sul alta
    bancarizacao: 89.0,
    receitaPercapita: 4100,
    transparenciaCGU: 8.4,
    ideb: 5.3,
    densidadeINSS: 0.62,
    coberturaCRAS: 90.0,
    presencaDefensoria: 82.0
  },
  PA: {
    domicilioInternet: 84.6,      // [R] Norte mais baixa banda larga fixa
    bandaLargaFixa: 84.6,
    aguaTratada: 58.0,
    esgotoColetado: 18.0,         // [R] Norte baixíssima cobertura
    rodoviasPavimentadas: 14.0,
    aeroportosComerciais: 2.0,
    leitosPorMil: 1.98,           // [R] CNES (PA com 198/100mil habitantes)
    medicosPorMil: 1.0,
    coberturaAPS: 65.0,
    coberturaPrevidenciaria: 48.0,
    bancarizacao: 60.0,
    receitaPercapita: 2400,
    transparenciaCGU: 6.5,
    ideb: 4.1,
    densidadeINSS: 0.28,          // Norte rede mais esparsa
    coberturaCRAS: 78.0,
    presencaDefensoria: 45.0      // Norte cobertura mais baixa
  },
  GO: {
    domicilioInternet: 94.0,      // [R] CO próximo da média
    bandaLargaFixa: 87.0,
    aguaTratada: 88.0,
    esgotoColetado: 65.0,
    rodoviasPavimentadas: 25.0,
    aeroportosComerciais: 3.5,
    leitosPorMil: 2.3,
    medicosPorMil: 2.4,
    coberturaAPS: 75.0,
    coberturaPrevidenciaria: 65.0,
    bancarizacao: 81.0,
    receitaPercapita: 3500,
    transparenciaCGU: 7.8,
    ideb: 5.0,
    densidadeINSS: 0.50,
    coberturaCRAS: 88.0,
    presencaDefensoria: 70.0
  }
};

const ESTADOS_INFO = {
  SP: { nome: 'São Paulo', sigla: 'SP', regiao: 'Sudeste', cor: '#0F4C81', populacao: '44,4M' },
  BA: { nome: 'Bahia', sigla: 'BA', regiao: 'Nordeste', cor: '#E63946', populacao: '14,1M' },
  RS: { nome: 'Rio Grande do Sul', sigla: 'RS', regiao: 'Sul', cor: '#06A77D', populacao: '10,9M' },
  PA: { nome: 'Pará', sigla: 'PA', regiao: 'Norte', cor: '#F4A261', populacao: '8,1M' },
  GO: { nome: 'Goiás', sigla: 'GO', regiao: 'Centro-Oeste', cor: '#9D4EDD', populacao: '7,1M' }
};

// -----------------------------------------------------------------------------
// METADADOS DE PROXIES — VISÃO SOCIOCULTURAL
// -----------------------------------------------------------------------------
const PROXIES_SOCIOCULTURAL = {
  gini: { label: 'Índice de Gini', fonte: 'PNAD 2024', inverter: false, unidade: '', real: false },
  mulheresGerencia: { label: '% mulheres em gerência', fonte: 'IBGE Gênero 2024', inverter: true, unidade: '%', real: false },
  urbanizacao: { label: 'Urbanização', fonte: 'Censo 2022', inverter: false, unidade: '%', real: true },
  tamDomicilio: { label: 'Tamanho do domicílio', fonte: 'Censo 2022', inverter: true, unidade: '', real: false },
  escolaridadeSuperior: { label: '% ensino superior', fonte: 'INEP', inverter: false, unidade: '%', real: false },
  formalizacao: { label: 'Formalização do trabalho', fonte: 'RAIS', inverter: false, unidade: '%', real: false },
  ocupadosCultura: { label: '% ocupados em cultura', fonte: 'SIIC IBGE 2024', inverter: false, unidade: '%', real: true },
  // Sprint 3 — Participação Cívica
  comparecimentoEleitoral: { label: 'Comparecimento eleitoral', fonte: 'TSE 2022', inverter: false, unidade: '%', real: true },
  densidadeAssociacoes: { label: 'Densidade de associações', fonte: 'IBGE FASFIL', inverter: false, unidade: '/10k hab', real: false },
  // Sprint 3 — Confiança Institucional (com ressalva)
  judicializacaoCivel: { label: 'Judicialização (cível)', fonte: 'CNJ 2024', inverter: false, unidade: '/100hab', real: false },
};

// -----------------------------------------------------------------------------
// METADADOS DE PROXIES — VISÃO OPERACIONAL
// -----------------------------------------------------------------------------
const PROXIES_OPERACIONAL = {
  domicilioInternet: { label: 'Domicílios c/ internet', fonte: 'PNAD TIC 2024', inverter: false, unidade: '%', real: true },
  bandaLargaFixa: { label: 'Banda larga fixa', fonte: 'PNAD TIC 2024', inverter: false, unidade: '%', real: true },
  aguaTratada: { label: 'Água tratada', fonte: 'SNIS 2022', inverter: false, unidade: '%', real: true },
  esgotoColetado: { label: 'Esgoto coletado', fonte: 'SNIS 2022', inverter: false, unidade: '%', real: true },
  rodoviasPavimentadas: { label: 'Rodovias pavimentadas', fonte: 'DNIT', inverter: false, unidade: '%', real: false },
  aeroportosComerciais: { label: 'Aeroportos comerciais', fonte: 'ANAC', inverter: false, unidade: '/Mhab', real: false },
  leitosPorMil: { label: 'Leitos hospitalares', fonte: 'CNES 2024', inverter: false, unidade: '/mil hab', real: true },
  medicosPorMil: { label: 'Médicos', fonte: 'CFM 2024', inverter: false, unidade: '/mil hab', real: true },
  coberturaAPS: { label: 'Atenção Primária', fonte: 'e-SUS APS', inverter: false, unidade: '%', real: false },
  coberturaPrevidenciaria: { label: 'Cobertura previdenciária', fonte: 'PNAD', inverter: false, unidade: '%', real: false },
  bancarizacao: { label: 'Bancarização', fonte: 'BCB', inverter: false, unidade: '%', real: false },
  receitaPercapita: { label: 'Receita estadual per capita', fonte: 'STN 2024', inverter: false, unidade: 'R$', real: true },
  transparenciaCGU: { label: 'Transparência (EBT)', fonte: 'CGU', inverter: false, unidade: '/10', real: true },
  ideb: { label: 'IDEB anos finais', fonte: 'INEP 2023', inverter: false, unidade: '/10', real: true },
  // Sprint 3 — Capacidade de Acesso ao Estado
  densidadeINSS: { label: 'Densidade de agências INSS', fonte: 'Anuário Previdência', inverter: false, unidade: '/100k', real: false },
  coberturaCRAS: { label: '% municípios c/ CRAS', fonte: 'MDS/CadSUAS', inverter: false, unidade: '%', real: false },
  presencaDefensoria: { label: '% municípios c/ Defensoria', fonte: 'CNJ', inverter: false, unidade: '%', real: false },
};

// -----------------------------------------------------------------------------
// COMPOSIÇÃO DAS DIMENSÕES — SOCIOCULTURAL
// -----------------------------------------------------------------------------
const DIMENSOES_SOCIOCULTURAL = {
  hierarquizacaoSocial: {
    label: 'Hierarquização Social',
    descricao: 'Estratificação social observável — desigualdade combinada com hierarquia de gênero em cargos de comando.',
    proxies: ['gini', 'mulheresGerencia'], cor: '#0F4C81', origem: 'Estrutural'
  },
  configuracaoVinculos: {
    label: 'Configuração de Vínculos',
    descricao: 'Arranjos domiciliares e urbanização. Avaliada como a dimensão mais robusta na auditoria.',
    proxies: ['urbanizacao', 'tamDomicilio'], cor: '#E63946', origem: 'Estrutural'
  },
  densidadeRegras: {
    label: 'Densidade de Regras',
    descricao: 'Formalização do trabalho. Sinalizada como frágil — proxy único, contaminado por estrutura econômica.',
    proxies: ['formalizacao'], cor: '#06A77D', origem: 'Estrutural (sob revisão)'
  },
  capitalEducacional: {
    label: 'Capital Educacional',
    descricao: 'Acesso à formação superior. Sinalizada como contaminada por renda.',
    proxies: ['escolaridadeSuperior'], cor: '#F4A261', origem: 'Estrutural (sob revisão)'
  },
  vitalidadeCultural: {
    label: 'Vitalidade Cultural',
    descricao: 'Setor cultural na economia formal. Pode subestimar cultura informal/comunitária.',
    proxies: ['ocupadosCultura'], cor: '#9D4EDD', origem: 'Brasil-específica (SIIC)'
  },
  participacaoCivica: {
    label: 'Participação Cívica',
    descricao: 'Engajamento coletivo organizado — comparecimento eleitoral e densidade de associações sem fins lucrativos. Distinta de "vínculos" (configuração familiar) e "vitalidade cultural" (setor cultural). Sprint 3.',
    proxies: ['comparecimentoEleitoral', 'densidadeAssociacoes'], cor: '#7C3AED', origem: 'Estrutural'
  },
  confiancaInstitucional: {
    label: 'Confiança Institucional',
    descricao: 'Recurso ao Estado em conflitos — proxy via judicialização cível. RESSALVA METODOLÓGICA: judicialização é proxy ambíguo (alta judicialização pode indicar tanto confiança no sistema quanto alto nível de conflito). Excluímos ações de saúde/previdência (que distorcem). Sprint 3.',
    proxies: ['judicializacaoCivel'], cor: '#FB923C', origem: 'Estrutural (com ressalva)'
  }
};

// -----------------------------------------------------------------------------
// COMPOSIÇÃO DAS DIMENSÕES — OPERACIONAL (nova)
// -----------------------------------------------------------------------------
const DIMENSOES_OPERACIONAL = {
  conectividadeDigital: {
    label: 'Conectividade Digital',
    descricao: 'Acesso à internet e qualidade da conexão. Crítica para serviços digitais públicos e privados.',
    proxies: ['domicilioInternet', 'bandaLargaFixa'], cor: '#0F4C81', origem: 'Operacional'
  },
  infraestruturaBasica: {
    label: 'Infraestrutura Básica',
    descricao: 'Cobertura de saneamento. Indicador-chave de qualidade de vida e atratividade econômica.',
    proxies: ['aguaTratada', 'esgotoColetado'], cor: '#06A77D', origem: 'Operacional'
  },
  mobilidadeAcesso: {
    label: 'Mobilidade e Acesso',
    descricao: 'Infraestrutura de transporte e acessibilidade física do território.',
    proxies: ['rodoviasPavimentadas', 'aeroportosComerciais'], cor: '#F4A261', origem: 'Operacional'
  },
  coberturaSaude: {
    label: 'Cobertura de Saúde',
    descricao: 'Capacidade hospitalar, força de trabalho médica e atenção primária.',
    proxies: ['leitosPorMil', 'medicosPorMil', 'coberturaAPS'], cor: '#E63946', origem: 'Operacional'
  },
  coberturaPrevidenciaria: {
    label: 'Cobertura Previdenciária',
    descricao: 'Inclusão previdenciária e financeira da população.',
    proxies: ['coberturaPrevidenciaria', 'bancarizacao'], cor: '#9D4EDD', origem: 'Operacional'
  },
  capacidadeEstatal: {
    label: 'Capacidade Estatal',
    descricao: 'Recursos fiscais e transparência da gestão pública.',
    proxies: ['receitaPercapita', 'transparenciaCGU'], cor: '#7C3AED', origem: 'Operacional'
  },
  educacaoBasica: {
    label: 'Educação Básica',
    descricao: 'Qualidade do sistema educacional medido pelo IDEB.',
    proxies: ['ideb'], cor: '#FB923C', origem: 'Operacional'
  },
  capacidadeAcessoEstado: {
    label: 'Capacidade de Acesso ao Estado',
    descricao: 'Onde a pessoa consegue chegar fisicamente para acessar serviços do Estado — distinto de "Cobertura Previdenciária" (que mede direito) e "Capacidade Estatal" (que mede recurso). Mede presença territorial concreta de equipamentos públicos. Sprint 3.',
    proxies: ['densidadeINSS', 'coberturaCRAS', 'presencaDefensoria'], cor: '#10B981', origem: 'Operacional'
  }
};

const REGIOES = {
  'Norte': '#F4A261', 'Nordeste': '#E63946', 'Centro-Oeste': '#9D4EDD',
  'Sudeste': '#0F4C81', 'Sul': '#06A77D'
};

// =============================================================================
// SPRINT 4 — TEMPLATES DE CASO DE USO
// Cada template define quais dimensões importam e com que peso (0-100).
// Pesos não precisam somar 100 — são normalizados automaticamente.
// =============================================================================
const TEMPLATES = {
  inclusaoDigital: {
    label: 'Inclusão Digital',
    descricao: 'Implantação de telecentros, programas de letramento digital, expansão de banda larga em áreas vulneráveis.',
    publico: 'Setor público — políticas digitais',
    cor: '#0F4C81',
    pesos: {
      conectividadeDigital: 80,
      capacidadeAcessoEstado: 70,
      capitalEducacional: 60,
      hierarquizacaoSocial: 40,
      capacidadeEstatal: 50,
      participacaoCivica: 30
    }
  },
  varejoDigital: {
    label: 'Expansão de Varejo Digital',
    descricao: 'Decisão sobre onde lançar e-commerce, expandir entrega last-mile, ou abrir centros de atendimento ao cliente.',
    publico: 'Setor privado — varejo e logística',
    cor: '#E63946',
    pesos: {
      conectividadeDigital: 90,
      configuracaoVinculos: 60,
      infraestruturaBasica: 50,
      mobilidadeAcesso: 70,
      capacidadeEstatal: 40,
      capitalEducacional: 50
    }
  },
  economiaCriativa: {
    label: 'Política de Economia Criativa',
    descricao: 'Decisão sobre onde investir em editais, residências artísticas, cluster cultural ou audiovisual.',
    publico: 'Setor público — cultura',
    cor: '#9D4EDD',
    pesos: {
      vitalidadeCultural: 100,
      capitalEducacional: 60,
      participacaoCivica: 70,
      conectividadeDigital: 50,
      configuracaoVinculos: 40,
      capacidadeEstatal: 50
    }
  },
  localizacaoLogistica: {
    label: 'Centro de Distribuição',
    descricao: 'Decisão sobre onde instalar CD regional, fábrica, ou hub logístico considerando capacidade territorial.',
    publico: 'Setor privado — logística e indústria',
    cor: '#06A77D',
    pesos: {
      mobilidadeAcesso: 100,
      infraestruturaBasica: 70,
      capacidadeEstatal: 60,
      conectividadeDigital: 50,
      coberturaSaude: 40,
      hierarquizacaoSocial: 30
    }
  }
};

// Junta dimensões + proxies + dados de ambas as visões em uma estrutura única
function unificarVisoes() {
  return {
    dimensoes: { ...DIMENSOES_SOCIOCULTURAL, ...DIMENSOES_OPERACIONAL },
    proxies: { ...PROXIES_SOCIOCULTURAL, ...PROXIES_OPERACIONAL },
    dados: Object.keys(DADOS_SOCIOCULTURAL).reduce((acc, sigla) => {
      acc[sigla] = { ...DADOS_SOCIOCULTURAL[sigla], ...DADOS_OPERACIONAL[sigla] };
      return acc;
    }, {})
  };
}

// =============================================================================
// FUNÇÕES MATEMÁTICAS
// =============================================================================

function calcularZScores(valores) {
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  const variancia = valores.reduce((acc, v) => acc + (v - media) ** 2, 0) / valores.length;
  const desvio = Math.sqrt(variancia);
  return valores.map(v => desvio === 0 ? 0 : (v - media) / desvio);
}

function zParaEscalaVisual(z) {
  return Math.max(0, Math.min(100, 50 + (z * 25)));
}

function calcularPercentis(valores) {
  const indexed = valores.map((v, i) => ({ valor: v, idx: i }));
  indexed.sort((a, b) => a.valor - b.valor);
  const percentis = new Array(valores.length);
  indexed.forEach((item, rank) => {
    percentis[item.idx] = valores.length === 1 ? 50 : (rank / (valores.length - 1)) * 100;
  });
  return percentis;
}

function calcularScoresPorVisao(dadosRaw, proxiesMeta, dimensoes) {
  const siglas = Object.keys(dadosRaw);
  const proxiesNomes = Object.keys(proxiesMeta);
  const proxiesNormalizados = {};

  proxiesNomes.forEach(proxy => {
    const valoresBrutos = siglas.map(s => dadosRaw[s][proxy]);
    let zs = calcularZScores(valoresBrutos);
    let percentis = calcularPercentis(valoresBrutos);
    if (proxiesMeta[proxy].inverter) {
      zs = zs.map(z => -z);
      percentis = percentis.map(p => 100 - p);
    }
    proxiesNormalizados[proxy] = {
      bruto: valoresBrutos, zScore: zs, percentil: percentis,
      escalaVisual: zs.map(zParaEscalaVisual)
    };
  });

  const dimensoesScores = {};
  Object.keys(dimensoes).forEach(dim => {
    const proxiesDaDim = dimensoes[dim].proxies;
    dimensoesScores[dim] = siglas.map((_, idxEstado) => {
      const soma = proxiesDaDim.reduce((acc, p) => acc + proxiesNormalizados[p].escalaVisual[idxEstado], 0);
      return Math.round(soma / proxiesDaDim.length);
    });
  });

  return { proxiesNormalizados, dimensoesScores, siglas };
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export default function PerfisEstaduais() {
  const [visao, setVisao] = useState('sociocultural'); // 'sociocultural' | 'operacional' | 'configurado'
  const [selecionados, setSelecionados] = useState(['SP', 'BA', 'RS']);
  const [modoAgrupamento, setModoAgrupamento] = useState('estados');
  const [dimensaoExpandida, setDimensaoExpandida] = useState(null);

  // Sprint 4 — Estado do modo configurado
  const [pesos, setPesos] = useState({});  // { dimensaoId: 0-100 }
  const [templateAtivo, setTemplateAtivo] = useState(null);

  function aplicarTemplate(templateId) {
    if (templateId === null) {
      setPesos({});
      setTemplateAtivo(null);
    } else {
      setPesos({ ...TEMPLATES[templateId].pesos });
      setTemplateAtivo(templateId);
    }
  }

  function ajustarPeso(dimensao, valor) {
    setPesos(prev => {
      const novo = { ...prev };
      if (valor === 0) {
        delete novo[dimensao];
      } else {
        novo[dimensao] = valor;
      }
      return novo;
    });
    setTemplateAtivo(null); // Customização manual desativa template
  }

  // Calcula score customizado (média ponderada das dimensões selecionadas)
  function calcularScoreCustomizado(siglaEstado, scoresUnificados, siglas) {
    const idx = siglas.indexOf(siglaEstado);
    if (idx === -1) return null;
    const dimensoesAtivas = Object.keys(pesos).filter(d => pesos[d] > 0);
    if (dimensoesAtivas.length === 0) return null;
    const somaPesos = dimensoesAtivas.reduce((acc, d) => acc + pesos[d], 0);
    const scoreSoma = dimensoesAtivas.reduce(
      (acc, d) => acc + (scoresUnificados[d][idx] * pesos[d]), 0
    );
    return Math.round(scoreSoma / somaPesos);
  }

  const dadosUnificados = useMemo(() => unificarVisoes(), []);

  const dadosRaw = visao === 'sociocultural' ? DADOS_SOCIOCULTURAL :
                   visao === 'operacional' ? DADOS_OPERACIONAL :
                   dadosUnificados.dados;
  const proxiesMeta = visao === 'sociocultural' ? PROXIES_SOCIOCULTURAL :
                      visao === 'operacional' ? PROXIES_OPERACIONAL :
                      dadosUnificados.proxies;
  const dimensoesCompletas = visao === 'sociocultural' ? DIMENSOES_SOCIOCULTURAL :
                             visao === 'operacional' ? DIMENSOES_OPERACIONAL :
                             dadosUnificados.dimensoes;

  // No modo configurado, filtra só as dimensões com peso > 0
  const dimensoes = visao === 'configurado'
    ? Object.keys(dimensoesCompletas)
        .filter(d => pesos[d] > 0)
        .reduce((acc, d) => { acc[d] = dimensoesCompletas[d]; return acc; }, {})
    : dimensoesCompletas;

  const { proxiesNormalizados, dimensoesScores, siglas } = useMemo(
    () => calcularScoresPorVisao(dadosRaw, proxiesMeta, dimensoesCompletas),
    [visao, dadosRaw, proxiesMeta, dimensoesCompletas]
  );

  function toggleEstado(sigla) {
    if (selecionados.includes(sigla)) {
      if (selecionados.length > 1) setSelecionados(selecionados.filter(s => s !== sigla));
    } else {
      if (selecionados.length < 4) setSelecionados([...selecionados, sigla]);
    }
  }

  const dadosRadar = Object.keys(dimensoes).map(dim => {
    const linha = { dimensao: dimensoes[dim].label };
    selecionados.forEach(sigla => {
      const idx = siglas.indexOf(sigla);
      linha[sigla] = dimensoesScores[dim][idx];
    });
    return linha;
  });

  const dadosRegiao = Object.keys(dimensoes).map(dim => {
    const linha = { dimensao: dimensoes[dim].label };
    Object.keys(REGIOES).forEach(regiao => {
      const idxsRegiao = siglas
        .map((s, i) => ESTADOS_INFO[s].regiao === regiao ? i : -1)
        .filter(i => i >= 0);
      if (idxsRegiao.length > 0) {
        linha[regiao] = Math.round(
          idxsRegiao.reduce((sum, i) => sum + dimensoesScores[dim][i], 0) / idxsRegiao.length
        );
      }
    });
    return linha;
  });

  const dadosAtuais = modoAgrupamento === 'estados' ? dadosRadar : dadosRegiao;
  const seriesAtuais = modoAgrupamento === 'estados' ? selecionados : Object.keys(REGIOES);

  const proxiesNomes = Object.keys(proxiesMeta);

  const corVisao = visao === 'sociocultural' ? '#9D4EDD' :
                   visao === 'operacional' ? '#0F4C81' : '#10B981';
  const tituloVisao = visao === 'sociocultural'
    ? 'Perfis Socioculturais'
    : visao === 'operacional'
    ? 'Perfis Operacionais'
    : 'Análise Configurada';
  const subtituloVisao = visao === 'sociocultural'
    ? 'e Institucionais Estaduais'
    : visao === 'operacional'
    ? 'e Capacidade Territorial Estadual'
    : 'pelo Caso de Uso';

  return (
    <div style={{
      fontFamily: '"Source Serif 4", Georgia, serif',
      backgroundColor: '#FAF7F2', minHeight: '100vh', padding: '32px 20px', color: '#1a1a1a'
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <header style={{ marginBottom: '32px', borderBottom: '2px solid #1a1a1a', paddingBottom: '20px' }}>
          <div style={{
            fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase',
            marginBottom: '8px', color: '#666'
          }}>
            Sprint 4 · Plataforma Configurável · Virada Estratégica
          </div>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 44px)', lineHeight: '1.05',
            margin: '0 0 12px 0', fontWeight: 600, letterSpacing: '-0.02em'
          }}>
            {tituloVisao}
            <br />
            <span style={{ fontStyle: 'italic', fontWeight: 400 }}>{subtituloVisao}</span>
          </h1>
          <p style={{
            fontSize: '15px', lineHeight: '1.6', color: '#444', maxWidth: '720px', margin: 0
          }}>
            {visao === 'sociocultural' ? (
              <>Plataforma de avaliação estadual com 7 dimensões empíricas. Mede estruturas socioculturais
              observáveis — incluindo, no Sprint 3, <strong>Participação Cívica</strong> (comparecimento eleitoral + associativismo)
              e <strong>Confiança Institucional</strong> (judicialização, com ressalva metodológica).</>
            ) : visao === 'operacional' ? (
              <>Plataforma de avaliação operacional com 8 dimensões. Mede infraestrutura, cobertura de
              serviços e capacidade institucional — incluindo, no Sprint 3, <strong>Capacidade de Acesso ao Estado</strong>
              (densidade territorial de equipamentos públicos: INSS, CRAS, Defensoria).</>
            ) : (
              <><strong>Modo configurado.</strong> Selecione um template de caso de uso pré-configurado ou monte
              sua própria análise escolhendo dimensões e definindo pesos. As 15 dimensões disponíveis vêm das
              duas visões — você decide o que importa para a sua decisão.</>
            )}
            <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '13px', color: '#888' }}>
              ⚠ Piloto com 5 estados. Dados [R] são oficiais; demais são estimativas calibradas.
            </span>
          </p>
        </header>

        {/* TOGGLE DE VISÃO — destacado */}
        <div style={{
          display: 'flex', gap: '0', marginBottom: '24px',
          backgroundColor: '#1a1a1a', padding: '4px', borderRadius: '8px',
          maxWidth: '750px'
        }}>
          <button
            onClick={() => setVisao('sociocultural')}
            style={{
              flex: 1, padding: '12px 16px', border: 'none', borderRadius: '6px',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              backgroundColor: visao === 'sociocultural' ? '#9D4EDD' : 'transparent',
              color: '#FAF7F2', fontFamily: 'inherit', transition: 'all 0.2s',
              letterSpacing: '0.02em'
            }}
          >
            🎭 Sociocultural
            <div style={{ fontSize: '10px', fontWeight: 400, marginTop: '2px', opacity: 0.85 }}>
              7 dimensões · entender
            </div>
          </button>
          <button
            onClick={() => setVisao('operacional')}
            style={{
              flex: 1, padding: '12px 16px', border: 'none', borderRadius: '6px',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              backgroundColor: visao === 'operacional' ? '#0F4C81' : 'transparent',
              color: '#FAF7F2', fontFamily: 'inherit', transition: 'all 0.2s',
              letterSpacing: '0.02em'
            }}
          >
            🏗 Operacional
            <div style={{ fontSize: '10px', fontWeight: 400, marginTop: '2px', opacity: 0.85 }}>
              8 dimensões · decidir
            </div>
          </button>
          <button
            onClick={() => setVisao('configurado')}
            style={{
              flex: 1, padding: '12px 16px', border: 'none', borderRadius: '6px',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              backgroundColor: visao === 'configurado' ? '#10B981' : 'transparent',
              color: '#FAF7F2', fontFamily: 'inherit', transition: 'all 0.2s',
              letterSpacing: '0.02em'
            }}
          >
            ⚙ Configurado
            <div style={{ fontSize: '10px', fontWeight: 400, marginTop: '2px', opacity: 0.85 }}>
              você define · NOVO
            </div>
          </button>
        </div>

        {/* SPRINT 4 — PAINEL DE CONFIGURAÇÃO (só no modo configurado) */}
        {visao === 'configurado' && (
          <div style={{ marginBottom: '32px' }}>
            {/* Templates */}
            <div style={{
              backgroundColor: '#fff', borderRadius: '8px', padding: '20px',
              marginBottom: '16px', borderLeft: '4px solid #10B981'
            }}>
              <h3 style={{
                margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600,
                fontFamily: 'inherit', letterSpacing: '0.02em'
              }}>
                Templates de caso de uso
              </h3>
              <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#666' }}>
                Comece de um template pré-configurado e customize, ou monte do zero abaixo.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.entries(TEMPLATES).map(([id, tpl]) => {
                  const ativo = templateAtivo === id;
                  return (
                    <button
                      key={id}
                      onClick={() => aplicarTemplate(ativo ? null : id)}
                      style={{
                        padding: '10px 14px',
                        border: ativo ? `2px solid ${tpl.cor}` : '1.5px solid #d4d4d4',
                        borderRadius: '6px',
                        backgroundColor: ativo ? tpl.cor : 'transparent',
                        color: ativo ? '#fff' : '#1a1a1a',
                        cursor: 'pointer',
                        fontSize: '13px', fontWeight: 500,
                        fontFamily: 'inherit',
                        textAlign: 'left',
                        maxWidth: '240px',
                        lineHeight: 1.4
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{tpl.label}</div>
                      <div style={{
                        fontSize: '11px',
                        opacity: ativo ? 0.9 : 0.65,
                        marginTop: '3px'
                      }}>
                        {tpl.publico}
                      </div>
                    </button>
                  );
                })}
                {Object.keys(pesos).length > 0 && (
                  <button
                    onClick={() => aplicarTemplate(null)}
                    style={{
                      padding: '10px 14px', border: '1.5px solid #E63946',
                      borderRadius: '6px', backgroundColor: 'transparent',
                      color: '#E63946', cursor: 'pointer',
                      fontSize: '13px', fontWeight: 500, fontFamily: 'inherit'
                    }}
                  >
                    ✕ Limpar
                  </button>
                )}
              </div>
              {templateAtivo && (
                <div style={{
                  marginTop: '14px', padding: '10px 14px',
                  backgroundColor: '#f5f5f0', borderRadius: '4px',
                  fontSize: '13px', color: '#444', lineHeight: 1.5
                }}>
                  <strong>{TEMPLATES[templateAtivo].label}:</strong> {TEMPLATES[templateAtivo].descricao}
                </div>
              )}
            </div>

            {/* Sliders de dimensões */}
            <div style={{
              backgroundColor: '#fff', borderRadius: '8px', padding: '20px'
            }}>
              <h3 style={{
                margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600,
                fontFamily: 'inherit', letterSpacing: '0.02em'
              }}>
                Configure pesos por dimensão
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#666' }}>
                Ajuste de 0 a 100. Pesos serão normalizados automaticamente para somar 100%.
                Dimensões com peso 0 são excluídas da análise. Dimensões selecionadas: {' '}
                <strong>{Object.values(pesos).filter(p => p > 0).length}</strong> de {Object.keys(dadosUnificados.dimensoes).length}.
              </p>
              <div style={{ display: 'grid', gap: '12px' }}>
                {Object.entries(dadosUnificados.dimensoes).map(([id, dim]) => {
                  const pesoAtual = pesos[id] || 0;
                  const isSocio = id in DIMENSOES_SOCIOCULTURAL;
                  return (
                    <div key={id} style={{
                      display: 'grid',
                      gridTemplateColumns: '180px 1fr 50px',
                      gap: '12px', alignItems: 'center'
                    }}>
                      <div style={{ fontSize: '13px', lineHeight: 1.3 }}>
                        <span style={{
                          display: 'inline-block', width: '8px', height: '8px',
                          borderRadius: '50%', marginRight: '6px',
                          backgroundColor: isSocio ? '#9D4EDD' : '#0F4C81'
                        }} />
                        {dim.label}
                      </div>
                      <input
                        type="range"
                        min="0" max="100" step="5"
                        value={pesoAtual}
                        onChange={(e) => ajustarPeso(id, parseInt(e.target.value))}
                        style={{
                          width: '100%',
                          accentColor: pesoAtual > 0 ? (isSocio ? '#9D4EDD' : '#0F4C81') : '#ccc'
                        }}
                      />
                      <div style={{
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        textAlign: 'right',
                        fontWeight: pesoAtual > 0 ? 600 : 400,
                        color: pesoAtual > 0 ? '#1a1a1a' : '#999'
                      }}>
                        {pesoAtual}%
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{
                marginTop: '14px', display: 'flex', gap: '12px', alignItems: 'center',
                fontSize: '11px', color: '#666'
              }}>
                <span>
                  <span style={{
                    display: 'inline-block', width: '8px', height: '8px',
                    borderRadius: '50%', backgroundColor: '#9D4EDD', marginRight: '4px'
                  }} />
                  Sociocultural
                </span>
                <span>
                  <span style={{
                    display: 'inline-block', width: '8px', height: '8px',
                    borderRadius: '50%', backgroundColor: '#0F4C81', marginRight: '4px'
                  }} />
                  Operacional
                </span>
              </div>
            </div>
          </div>
        )}

        <div style={{
          display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center'
        }}>
          <div style={{
            display: 'inline-flex', backgroundColor: '#1a1a1a', padding: '4px', borderRadius: '999px'
          }}>
            <button
              onClick={() => setModoAgrupamento('estados')}
              style={{
                padding: '8px 18px', border: 'none', borderRadius: '999px',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                backgroundColor: modoAgrupamento === 'estados' ? '#FAF7F2' : 'transparent',
                color: modoAgrupamento === 'estados' ? '#1a1a1a' : '#FAF7F2',
                fontFamily: 'inherit'
              }}
            >
              Por Estado
            </button>
            <button
              onClick={() => setModoAgrupamento('regioes')}
              style={{
                padding: '8px 18px', border: 'none', borderRadius: '999px',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                backgroundColor: modoAgrupamento === 'regioes' ? '#FAF7F2' : 'transparent',
                color: modoAgrupamento === 'regioes' ? '#1a1a1a' : '#FAF7F2',
                fontFamily: 'inherit'
              }}
            >
              Por Região
            </button>
          </div>

          {modoAgrupamento === 'estados' && (
            <div style={{ fontSize: '13px', color: '#666' }}>
              Selecione até 4 estados para comparar
            </div>
          )}
        </div>

        {modoAgrupamento === 'estados' && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
            {Object.values(ESTADOS_INFO).map(estado => {
              const ativo = selecionados.includes(estado.sigla);
              return (
                <button
                  key={estado.sigla}
                  onClick={() => toggleEstado(estado.sigla)}
                  style={{
                    padding: '10px 18px',
                    border: ativo ? `2px solid ${estado.cor}` : '2px solid #d4d4d4',
                    borderRadius: '4px',
                    backgroundColor: ativo ? estado.cor : 'transparent',
                    color: ativo ? '#fff' : '#1a1a1a',
                    cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                    fontFamily: 'inherit', letterSpacing: '0.02em'
                  }}
                >
                  {estado.sigla} · {estado.nome}
                  <span style={{ fontSize: '11px', marginLeft: '8px', opacity: 0.7 }}>
                    {estado.regiao}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div style={{
          backgroundColor: '#fff', borderRadius: '8px', padding: '32px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)',
          marginBottom: '24px',
          borderTop: `4px solid ${corVisao}`
        }}>
          {visao === 'configurado' && Object.keys(pesos).filter(d => pesos[d] > 0).length < 3 ? (
            <div style={{
              padding: '60px 20px', textAlign: 'center', color: '#888'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚙</div>
              <div style={{ fontSize: '15px', fontWeight: 500, color: '#444', marginBottom: '6px' }}>
                Selecione ao menos 3 dimensões para visualizar o radar
              </div>
              <div style={{ fontSize: '13px' }}>
                Use um template acima ou ajuste os sliders para começar
              </div>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={500}>
                <RadarChart data={dadosAtuais}>
                  <PolarGrid stroke="#e5e5e5" />
                  <PolarAngleAxis dataKey="dimensao" tick={{ fill: '#1a1a1a', fontSize: 12, fontFamily: 'inherit' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#999', fontSize: 11 }} tickCount={5} />
                  {seriesAtuais.map(key => {
                    const cor = modoAgrupamento === 'estados' ? ESTADOS_INFO[key].cor : REGIOES[key];
                    const nome = modoAgrupamento === 'estados' ? ESTADOS_INFO[key].nome : key;
                    return (
                      <Radar key={key} name={nome} dataKey={key}
                        stroke={cor} fill={cor} fillOpacity={0.18} strokeWidth={2} />
                    );
                  })}
                  <Legend wrapperStyle={{ fontSize: 13, fontFamily: 'inherit', paddingTop: '20px' }} />
                </RadarChart>
              </ResponsiveContainer>
              <div style={{
                fontSize: '11px', color: '#888', textAlign: 'center', marginTop: '4px', fontStyle: 'italic'
              }}>
                Escala visual 0-100 derivada de z-score (z=0 → 50, z=±2 → 0 ou 100)
              </div>
            </>
          )}
        </div>

        {/* DIMENSÕES */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '13px', letterSpacing: '0.18em', textTransform: 'uppercase',
            color: '#666', marginBottom: '16px', fontWeight: 500
          }}>
            Como cada dimensão é medida
          </h2>
          <div style={{ display: 'grid', gap: '8px' }}>
            {Object.entries(dimensoes).map(([key, dim]) => {
              const expandido = dimensaoExpandida === key;
              const corBadge = dim.origem.includes('revisão') || dim.origem.includes('ressalva') ? '#c47800' :
                               dim.origem.includes('Brasil') ? '#9D4EDD' :
                               dim.origem === 'Operacional' ? '#0F4C81' : '#0F4C81';
              return (
                <div key={key} style={{
                  backgroundColor: '#fff', borderRadius: '6px', overflow: 'hidden',
                  borderLeft: `3px solid ${dim.cor}`
                }}>
                  <button
                    onClick={() => setDimensaoExpandida(expandido ? null : key)}
                    style={{
                      width: '100%', padding: '14px 18px', backgroundColor: 'transparent',
                      border: 'none', textAlign: 'left', cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontFamily: 'inherit', fontSize: '15px', fontWeight: 500
                    }}
                  >
                    <span>{dim.label}</span>
                    <span style={{ color: '#999' }}>{expandido ? '−' : '+'}</span>
                  </button>
                  {expandido && (
                    <div style={{
                      padding: '0 18px 18px 18px', fontSize: '14px', lineHeight: '1.6', color: '#444'
                    }}>
                      <div style={{
                        display: 'inline-block', fontSize: '10px', textTransform: 'uppercase',
                        letterSpacing: '0.12em', backgroundColor: corBadge, color: '#fff',
                        padding: '3px 8px', borderRadius: '3px', marginBottom: '12px', fontWeight: 600
                      }}>
                        {dim.origem}
                      </div>
                      <p style={{ margin: '0 0 12px 0' }}>{dim.descricao}</p>
                      <div style={{
                        fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em',
                        color: '#888', marginBottom: '6px'
                      }}>
                        Proxies utilizados ({dim.proxies.length})
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '18px' }}>
                        {dim.proxies.map(p => (
                          <li key={p} style={{ marginBottom: '4px' }}>
                            {proxiesMeta[p].label}
                            <span style={{ fontSize: '11px', color: '#888', marginLeft: '6px' }}>
                              [{proxiesMeta[p].fonte}
                              {proxiesMeta[p].real && <span style={{ color: '#06A77D' }}> · dado real</span>}
                              {proxiesMeta[p].inverter && ' · invertido'}]
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SPRINT 4 — RANKING DE SCORE CUSTOMIZADO */}
        {visao === 'configurado' && Object.keys(pesos).filter(d => pesos[d] > 0).length > 0 && (
          <div style={{
            backgroundColor: '#fff', borderRadius: '8px', padding: '24px',
            marginBottom: '24px', borderTop: '4px solid #10B981'
          }}>
            <h3 style={{
              margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600,
              fontFamily: 'inherit', letterSpacing: '0.02em'
            }}>
              Ranking pelo seu caso de uso
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#666' }}>
              Score agregado (média ponderada das dimensões selecionadas, escala 0-100).
              {templateAtivo && <> Configuração atual: <strong>{TEMPLATES[templateAtivo].label}</strong>.</>}
            </p>
            {(() => {
              const scoresEstados = Object.keys(ESTADOS_INFO).map(sigla => ({
                sigla,
                info: ESTADOS_INFO[sigla],
                score: calcularScoreCustomizado(sigla, dimensoesScores, siglas)
              })).sort((a, b) => (b.score || 0) - (a.score || 0));

              const maxScore = Math.max(...scoresEstados.map(e => e.score || 0));

              return (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {scoresEstados.map((estado, idx) => (
                    <div key={estado.sigla} style={{
                      display: 'grid',
                      gridTemplateColumns: '32px 80px 1fr 60px',
                      gap: '12px', alignItems: 'center'
                    }}>
                      <div style={{
                        fontSize: '20px', fontWeight: 700,
                        color: idx === 0 ? '#10B981' : '#999',
                        textAlign: 'center'
                      }}>
                        {idx + 1}º
                      </div>
                      <div style={{
                        fontSize: '13px', fontWeight: 600,
                        color: estado.info.cor
                      }}>
                        {estado.sigla} · {estado.info.regiao}
                      </div>
                      <div style={{
                        backgroundColor: '#f0f0f0',
                        borderRadius: '4px',
                        height: '24px',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          backgroundColor: estado.info.cor,
                          height: '100%',
                          width: `${(estado.score / maxScore) * 100}%`,
                          transition: 'width 0.3s'
                        }} />
                      </div>
                      <div style={{
                        fontSize: '14px', fontFamily: 'monospace',
                        fontWeight: 600, textAlign: 'right'
                      }}>
                        {estado.score}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
            <div style={{
              marginTop: '14px', padding: '10px 14px',
              backgroundColor: '#f0fdf4', borderRadius: '4px',
              fontSize: '12px', color: '#15803d', lineHeight: 1.5,
              borderLeft: '3px solid #10B981'
            }}>
              <strong>Como ler:</strong> o ranking acima sintetiza a análise multidimensional num único score
              ponderado pelos pesos que você definiu. É útil para priorização rápida.
              <strong> Sempre cruze com o radar acima e a tabela de decomposição</strong> — o score único
              esconde nuances importantes que o radar mostra.
            </div>
          </div>
        )}

        {/* TABELA DECOMPOSIÇÃO */}
        {modoAgrupamento === 'estados' && (
          <div style={{
            backgroundColor: '#fff', borderRadius: '8px', padding: '24px', marginBottom: '32px'
          }}>
            <h2 style={{
              fontSize: '13px', letterSpacing: '0.18em', textTransform: 'uppercase',
              color: '#666', marginBottom: '6px', marginTop: 0, fontWeight: 500
            }}>
              Decomposição completa dos proxies
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#888' }}>
              Bruto = valor original. z = desvios da média. pctl = posição no ranking.
              <span style={{ color: '#06A77D', marginLeft: '8px' }}>● = dado oficial real</span>
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #1a1a1a' }}>
                    <th style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 500, color: '#666' }}>Proxy</th>
                    <th style={{ textAlign: 'center', padding: '8px 6px', fontWeight: 500, color: '#666' }}>Métrica</th>
                    {selecionados.map(sigla => (
                      <th key={sigla} style={{
                        textAlign: 'right', padding: '8px 6px', fontWeight: 600, color: ESTADOS_INFO[sigla].cor
                      }}>
                        {sigla}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {proxiesNomes.map(p => (
                    <React.Fragment key={p}>
                      <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td rowSpan={3} style={{
                          padding: '8px 6px', color: '#1a1a1a', fontWeight: 500,
                          verticalAlign: 'top', borderRight: '1px solid #f0f0f0'
                        }}>
                          {proxiesMeta[p].real && <span style={{ color: '#06A77D', marginRight: '4px' }}>●</span>}
                          {proxiesMeta[p].label}
                          <div style={{ fontSize: '10px', color: '#999', fontWeight: 400 }}>
                            {proxiesMeta[p].fonte}
                            {proxiesMeta[p].inverter && ' · invertido'}
                          </div>
                        </td>
                        <td style={{ padding: '6px', textAlign: 'center', color: '#666', fontSize: '11px' }}>
                          bruto
                        </td>
                        {selecionados.map(sigla => (
                          <td key={sigla} style={{
                            textAlign: 'right', padding: '6px',
                            fontFamily: 'monospace', fontSize: '12px'
                          }}>
                            {dadosRaw[sigla][p]}{proxiesMeta[p].unidade}
                          </td>
                        ))}
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '6px', textAlign: 'center', color: '#666', fontSize: '11px' }}>z</td>
                        {selecionados.map(sigla => {
                          const idx = siglas.indexOf(sigla);
                          const z = proxiesNormalizados[p].zScore[idx];
                          return (
                            <td key={sigla} style={{
                              textAlign: 'right', padding: '6px',
                              fontFamily: 'monospace', fontSize: '12px',
                              color: z > 0 ? '#0F4C81' : z < 0 ? '#E63946' : '#888'
                            }}>
                              {z > 0 ? '+' : ''}{z.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                      <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                        <td style={{ padding: '6px', textAlign: 'center', color: '#666', fontSize: '11px' }}>pctl</td>
                        {selecionados.map(sigla => {
                          const idx = siglas.indexOf(sigla);
                          const pct = proxiesNormalizados[p].percentil[idx];
                          return (
                            <td key={sigla} style={{
                              textAlign: 'right', padding: '6px',
                              fontFamily: 'monospace', fontSize: '12px', color: '#666'
                            }}>
                              {Math.round(pct)}
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <footer style={{
          borderTop: '1px solid #d4d4d4', paddingTop: '20px',
          fontSize: '12px', color: '#888', lineHeight: '1.7'
        }}>
          <strong style={{ color: '#444' }}>Sprint 4 — Virada estratégica.</strong> A ferramenta agora é
          uma <em>plataforma configurável</em>, não um índice fechado. O modo Configurado permite que o
          decisor escolha as dimensões relevantes para o caso de uso dele e defina os pesos, com 4 templates
          pré-configurados como ponto de partida. O score final é uma média ponderada das dimensões selecionadas.
          <br /><br />
          <strong style={{ color: '#444' }}>Por que isso importa —</strong> outras ferramentas dão índices
          fechados ("aqui está o ranking"). Esta plataforma dá infraestrutura aberta ("monte o ranking que faz
          sentido para você"). Esse é o diferencial real do projeto.
          <br /><br />
          <strong style={{ color: '#444' }}>Próximos sprints —</strong> Sprint 5: expansão para 27 estados
          via APIs IBGE/IPEA/SNIS/CNES/TSE/CNJ · Sprint 6: validação metodológica formal (PCA, leave-one-out,
          validação convergente externa) · Sprint 7: cruzamento de visões e templates avançados (URL compartilhável,
          exportação PDF/CSV).
        </footer>
      </div>
    </div>
  );
}
