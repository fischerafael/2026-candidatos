// Patrimônio declarado à Justiça Eleitoral (ver scripts/fetch-bens.mjs)
export const NOT_DECLARED = 'Não declarou';
// Faixas mais estreitas onde há mais candidatos (até ~R$ 2 mi) e mais largas na cauda
export const WEALTH_BANDS = [
  [50e3, 'Até R$ 50 mil'],
  [100e3, 'R$ 50 a 100 mil'],
  [250e3, 'R$ 100 a 250 mil'],
  [500e3, 'R$ 250 a 500 mil'],
  [750e3, 'R$ 500 a 750 mil'],
  [1e6, 'R$ 750 mil a 1 milhão'],
  [2e6, 'R$ 1 a 2 milhões'],
  [5e6, 'R$ 2 a 5 milhões'],
  [10e6, 'R$ 5 a 10 milhões'],
  [50e6, 'R$ 10 a 50 milhões'],
  [Infinity, 'Mais de R$ 50 milhões'],
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

// Valor digitado no filtro de faixa livre: "500 mil", "1,5 mi", "2 bi", "250.000", "R$ 80000".
// Vazio → null; texto que não dá para entender → NaN.
const UNITS = { mil: 1e3, k: 1e3, mi: 1e6, m: 1e6, milhao: 1e6, milhoes: 1e6, bi: 1e9, bilhao: 1e9, bilhoes: 1e9 };
export function parseMoney(text) {
  const t = text.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/^r\$/, '').replace(/\s+/g, '');
  if (!t) return null;
  const m = t.match(/^(\d[\d.,]*)([a-z]*)$/);
  if (!m || (m[2] && !UNITS[m[2]])) return NaN;
  let n = m[1];
  if (n.includes(',')) n = n.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(n)) n = n.replace(/\./g, '');
  return Number(n) * (UNITS[m[2]] || 1);
}

// Rótulo da faixa livre para a etiqueta de filtro ativo: "R$ 500 mil a 2 mi", "a partir de R$ 1 mi"
export function wealthRangeLabel(wmin, wmax) {
  const a = parseMoney(wmin);
  const b = parseMoney(wmax);
  const ok = (v) => Number.isFinite(v);
  if (ok(a) && ok(b)) return `${money(a)} a ${money(b).slice(3)}`;
  if (ok(a)) return `a partir de ${money(a)}`;
  if (ok(b)) return `até ${money(b)}`;
  return `“${wmin || wmax}” (valor inválido)`;
}
