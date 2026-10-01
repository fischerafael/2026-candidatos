export const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const fmt = (n) => n.toLocaleString('pt-BR');
export const pct = (v, total) => {
  if (!total) return '0%';
  if (v > 0 && v / total < 0.005) return '<1%';
  return `${Math.round((v / total) * 100)}%`;
};
