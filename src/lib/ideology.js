// Posição ideológica dos partidos na escala esquerda-direita (0 = extrema esquerda, 10 = extrema direita).
// Fonte: survey com cientistas políticos da ABCP, onda de 2022, média por partido (tabela 1) em
// Bolognesi, Ribeiro, Codato e Silva, "O desaparecimento do centro ideológico no sistema partidário
// brasileiro: a classificação mais atualizada dos experts", Opinião Pública, v. 31, e31120, 2025.
//
// A classificação é do PARTIDO, não do candidato. Siglas que mudaram depois de 2022 seguem a regra
// do próprio artigo: troca de nome mantém a nota, fusão usa a média aritmética das siglas fundidas
// e incorporação mantém só a nota do partido que incorporou.
export const IDEOLOGY_SOURCE = {
  label: 'Bolognesi, Ribeiro, Codato e Silva (2025), survey com cientistas políticos, onda de 2022',
  url: 'https://doi.org/10.1590/1807-0191202531120',
};

export const PARTY_SCORE = {
  PSTU: 0.51,
  PCO: 0.55,
  PCB: 0.69,
  PSOL: 1.41,
  UP: 1.63,
  PCDOB: 1.78,
  PT: 2.68,
  PSB: 3.59,
  REDE: 3.69,
  PDT: 3.86,
  PV: 4.12,
  SOLIDARIEDADE: 6.01, // incorporou o PROS em 2023
  CIDADANIA: 6.17,
  AVANTE: 6.47,
  MDB: 6.5,
  MOBILIZA: 6.74, // antigo PMN
  PSDB: 6.76,
  PSD: 6.94,
  DEMOCRATA: 7.29, // antigo PMB
  PODE: 7.44, // incorporou o PSC em 2023
  PRTB: 7.49,
  AGIR: 7.55,
  PP: 8.15,
  PRD: 8.16, // fusão de PTB (7,72) e Patriota (8,60)
  DC: 8.21,
  REPUBLICANOS: 8.33,
  UNIÃO: 8.49,
  NOVO: 8.67,
  PL: 8.8,
  // MISSÃO: criado depois do survey, sem nota
};

// Ajustes editoriais do projeto: a faixa abaixo prevalece sobre a calculada pela nota do survey
export const BAND_OVERRIDE = {
  PSOL: 'Esquerda', // 1,41 no survey cairia em extrema esquerda
  MISSÃO: 'Extrema direita', // sem nota no survey
};

// Faixas definidas no artigo
export const BANDS = [
  [1.5, 'Extrema esquerda'],
  [3, 'Esquerda'],
  [4.49, 'Centro-esquerda'],
  [5.5, 'Centro'],
  [7, 'Centro-direita'],
  [8.5, 'Direita'],
  [10, 'Extrema direita'],
];
export const NO_BAND = 'Sem classificação';

export const bandOf = (sg) => {
  if (BAND_OVERRIDE[sg]) return BAND_OVERRIDE[sg];
  const s = PARTY_SCORE[sg];
  return s === undefined ? NO_BAND : BANDS.find(([max]) => s <= max)[1];
};

const fmtScore = (s) => s.toFixed(2).replace('.', ',');

export const scoreLabel = (sg) => {
  const s = PARTY_SCORE[sg];
  if (BAND_OVERRIDE[sg]) {
    return `${bandOf(sg)} (ajuste editorial${s === undefined ? '' : `; survey: ${fmtScore(s)}`})`;
  }
  return s === undefined ? NO_BAND : `${bandOf(sg)} (${fmtScore(s)})`;
};
