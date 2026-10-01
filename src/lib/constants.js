// Posições fixas de cada campo dentro de uma linha do JSON (ver scripts/prepare-data.mjs)
export const COL = { num: 0, urna: 1, nome: 2, social: 3, age: 4, nasc: 5, colig: 17, comp: 18, ue: 19, sq: 20 };
export const FACET_START = 6; // a partir daqui vêm os índices categóricos, na ordem de data.keys

export const UF_NAME = {
  AC: 'Acre', AL: 'Alagoas', AM: 'Amazonas', AP: 'Amapá', BA: 'Bahia', BR: 'Nacional', CE: 'Ceará',
  DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MG: 'Minas Gerais',
  MS: 'Mato Grosso do Sul', MT: 'Mato Grosso', PA: 'Pará', PB: 'Paraíba', PE: 'Pernambuco', PI: 'Piauí',
  PR: 'Paraná', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RO: 'Rondônia', RR: 'Roraima',
  RS: 'Rio Grande do Sul', SC: 'Santa Catarina', SE: 'Sergipe', SP: 'São Paulo', TO: 'Tocantins',
};

// Ordens "naturais" para categorias que não devem ficar em ordem alfabética
export const ORDER = {
  cargo: ['Presidente', 'Vice-presidente', 'Governador', 'Vice-governador', 'Senador', '1º suplente', '2º suplente',
    'Deputado federal', 'Deputado estadual', 'Deputado distrital'],
  instr: ['Lê e escreve', 'Ensino fundamental incompleto', 'Ensino fundamental completo', 'Ensino médio incompleto',
    'Ensino médio completo', 'Superior incompleto', 'Superior completo', 'Não divulgável'],
};

// Rótulos curtos usados nos gráficos
export const SHORT = {
  'Ensino fundamental incompleto': 'Fundamental incompl.',
  'Ensino fundamental completo': 'Fundamental completo',
  'Ensino médio incompleto': 'Médio incompleto',
  'Ensino médio completo': 'Médio completo',
  'Deputado estadual': 'Dep. estadual',
  'Deputado federal': 'Dep. federal',
  'Deputado distrital': 'Dep. distrital',
};

// type: lista (padrão) | uf | chips | search | age
export const FACETS = [
  { k: 'cargo', label: 'Cargo', open: true },
  { k: 'uf', label: 'Estado', open: true, type: 'uf' },
  { k: 'partido', label: 'Partido', open: true, type: 'chips', sortByCount: true },
  { k: 'fed', label: 'Federação' },
  { k: 'genero', label: 'Gênero' },
  { k: 'raca', label: 'Cor/raça' },
  { k: 'instr', label: 'Escolaridade' },
  { k: 'age', label: 'Idade', type: 'age' },
  { k: 'civil', label: 'Estado civil' },
  { k: 'ocup', label: 'Ocupação', type: 'search', sortByCount: true },
  { k: 'agrem', label: 'Forma de concorrer' },
  { k: 'ufnasc', label: 'Estado de nascimento', type: 'search', sortByCount: true },
];
export const FACET_LABEL = Object.fromEntries(FACETS.map((f) => [f.k, f.label]));

export const AGE_BUCKETS = [
  [18, 29, '18 a 29'], [30, 39, '30 a 39'], [40, 49, '40 a 49'],
  [50, 59, '50 a 59'], [60, 69, '60 a 69'], [70, 120, '70 ou mais'],
];
export const AGE_PRESETS = [[18, 29, 'Até 29'], [30, 49, '30–49'], [50, 69, '50–69'], [70, '', '70+']];

export const SORTS = [
  ['urna', 'Nome de urna (A–Z)'],
  ['young', 'Mais jovens primeiro'],
  ['old', 'Mais velhos primeiro'],
  ['num', 'Número'],
  ['partido', 'Partido'],
  ['uf', 'Estado'],
];

export const PAGE_SIZE = 60;
export const PAGE_STEP = 120;
