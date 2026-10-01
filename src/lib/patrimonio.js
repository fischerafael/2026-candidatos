// Patrimônio declarado à Justiça Eleitoral (ver scripts/fetch-bens.mjs)
export const NOT_DECLARED = 'Não declarou';
export const WEALTH_BANDS = [
  [100e3, 'Até R$ 100 mil'],
  [500e3, 'R$ 100 mil a 500 mil'],
  [1e6, 'R$ 500 mil a 1 milhão'],
  [5e6, 'R$ 1 a 5 milhões'],
  [10e6, 'R$ 5 a 10 milhões'],
  [Infinity, 'Mais de R$ 10 milhões'],
];
export const WEALTH_LABELS = [...WEALTH_BANDS.map(([, l]) => l), NOT_DECLARED];
export const wealthBand = (total) => (total < 0 ? WEALTH_BANDS.length : WEALTH_BANDS.findIndex(([max]) => total < max));

export const WEALTH_NOTE = 'Valores declarados pelo candidato, em geral pelo custo de aquisição (regra do Imposto de Renda), '
  + 'não pelo valor de mercado. "Não declarou" não significa que não tenha bens.';

const one = (n, d) => n.toLocaleString('pt-BR', { maximumFractionDigits: d });

// R$ 1,2 mi · R$ 450 mil · R$ 980
export function money(v) {
  if (v >= 1e9) return `R$ ${one(v / 1e9, 1)} bi`;
  if (v >= 1e6) return `R$ ${one(v / 1e6, 1)} mi`;
  if (v >= 1e3) return `R$ ${one(v / 1e3, 0)} mil`;
  return `R$ ${one(v, 0)}`;
}
export const moneyFull = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
