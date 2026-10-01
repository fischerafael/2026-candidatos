import { createContext, useContext, useEffect, useState } from 'react';
import { FACET_START, ORDER } from './constants.js';
import { norm } from './format.js';

const DataContext = createContext(null);
export const DataProvider = DataContext.Provider;
export const useData = () => useContext(DataContext);

// Carrega o JSON gerado por scripts/prepare-data.mjs e pré-calcula o índice de busca
export function useCandidatosData() {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/candidatos.json`).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
      loadPhotoIndex(),
    ])
      .then(([raw, photos]) => alive && setState({ status: 'ready', data: enrich(raw, photos), error: null }))
      .catch((error) => alive && setState({ status: 'error', data: null, error }));
    return () => { alive = false; };
  }, []);
  return state;
}

// Fotos: por padrão em public/fotos (geradas por `npm run fotos`). Para servir de um bucket/CDN
// externo, defina VITE_PHOTO_BASE_URL (com barra no final) no build.
export const PHOTO_BASE = import.meta.env.VITE_PHOTO_BASE_URL || `${import.meta.env.BASE_URL}fotos/`;
export const photoUrl = (sq) => `${PHOTO_BASE}${sq}.jpg`;

// O índice é opcional: sem ele o app funciona normalmente, só que sem fotos.
function loadPhotoIndex() {
  return fetch(`${PHOTO_BASE}index.json`)
    .then((r) => (r.ok ? r.json() : []))
    .then((ids) => new Set(Array.isArray(ids) ? ids : []))
    .catch(() => new Set());
}

function enrich(raw, photos) {
  const fi = {};
  raw.keys.forEach((k, i) => { fi[k] = FACET_START + i; });
  const search = raw.rows.map((r) => norm(`${r[1]} ${r[2]} ${r[3]} ${r[0]}`));
  return { ...raw, fi, search, photos };
}

// Índices de um dicionário na ordem de exibição (sem valores vazios)
export function orderOf(data, k) {
  const d = data.dicts[k];
  const idx = d.map((_, i) => i).filter((i) => d[i] !== '');
  if (ORDER[k]) idx.sort((a, b) => ORDER[k].indexOf(d[a]) - ORDER[k].indexOf(d[b]));
  if (k === 'uf') idx.sort((a, b) => (d[a] === 'BR') - (d[b] === 'BR') || d[a].localeCompare(d[b]));
  return idx;
}
