// Mantém o estado dos filtros no hash da URL, para que um recorte possa ser compartilhado por link.
export function readHash(data) {
  const st = { q: '', sel: {}, amin: '', amax: '', wmin: '', wmax: '', sort: 'urna', onlyPhoto: false, view: 'list' };
  try {
    const p = new URLSearchParams(window.location.hash.slice(1));
    st.q = p.get('q') || '';
    st.amin = p.get('amin') || '';
    st.amax = p.get('amax') || '';
    st.wmin = p.get('pmin') || '';
    st.wmax = p.get('pmax') || '';
    st.sort = p.get('sort') || 'urna';
    st.onlyPhoto = p.get('foto') === '1';
    st.view = p.get('ver') === 'fotos' ? 'grid' : 'list';
    data.keys.forEach((k) => {
      const v = p.get(k);
      if (!v) return;
      const ids = v.split('|').map((x) => data.dicts[k].indexOf(x)).filter((i) => i >= 0);
      if (ids.length) st.sel[k] = ids;
    });
  } catch { /* hash inválido: começa do zero */ }
  return st;
}

export function writeHash(data, { q, sel, amin, amax, wmin, wmax, sort, onlyPhoto, view }) {
  const p = new URLSearchParams();
  if (q) p.set('q', q);
  data.keys.forEach((k) => {
    if (sel[k]?.length) p.set(k, sel[k].map((i) => data.dicts[k][i]).join('|'));
  });
  if (amin) p.set('amin', amin);
  if (amax) p.set('amax', amax);
  if (wmin) p.set('pmin', wmin);
  if (wmax) p.set('pmax', wmax);
  if (sort !== 'urna') p.set('sort', sort);
  if (onlyPhoto) p.set('foto', '1');
  if (view === 'grid') p.set('ver', 'fotos');
  const h = p.toString();
  window.history.replaceState(null, '', h ? `#${h}` : window.location.pathname + window.location.search);
}
