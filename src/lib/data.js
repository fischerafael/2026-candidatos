import { createContext, useContext, useEffect, useState } from 'react';
import { COL, FACET_START, ORDER } from './constants.js';
import { norm } from './format.js';
import { BANDS, bandOf, NO_BAND } from './ideology.js';
import { WEALTH_LABELS, wealthBand } from './patrimonio.js';

const DataContext = createContext(null);
export const DataProvider = DataContext.Provider;
export const useData = () => useContext(DataContext);

// Carrega o JSON gerado por scripts/prepare-data.mjs e pré-calcula o índice de busca
export function useCandidatosData() {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch(`${DATA_BASE}candidatos.json`).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
      loadPhotoIndex(),
      loadOptional(`${DATA_BASE}patrimonio.json`),
    ])
      .then(([raw, photos, wealth]) => alive && setState({ status: 'ready', data: enrich(raw, photos, wealth), error: null }))
      .catch((error) => alive && setState({ status: 'error', data: null, error }));
    return () => { alive = false; };
  }, []);
  return state;
}

const DATA_BASE = `${import.meta.env.BASE_URL}data/`;
const loadOptional = (url) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);

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

// Detalhes por estado (public/data/<dir>/<UF>.json: bens, redes), baixados só quando alguém abre uma ficha
const ufCache = new Map();
export function loadByUf(dir, uf) {
  const key = `${dir}/${uf}`;
  if (!ufCache.has(key)) {
    ufCache.set(key, fetch(`${DATA_BASE}${key}.json`).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }).catch((e) => { ufCache.delete(key); throw e; }));
  }
  return ufCache.get(key);
}

function enrich(raw, photos, wealthJson) {
  const fi = {};
  raw.keys.forEach((k, i) => { fi[k] = FACET_START + i; });
  const search = raw.rows.map((r) => norm(`${r[1]} ${r[2]} ${r[3]} ${r[0]}`));
  const data = { ...raw, keys: [...raw.keys], dicts: { ...raw.dicts }, fi, search, photos, multi: {} };

  // Espectro: derivado do partido (ver ideology.js)
  const espectro = [...BANDS.map(([, l]) => l), NO_BAND];
  const pos = new Map(espectro.map((l, i) => [l, i]));
  const byParty = raw.dicts.partido.map((sg) => pos.get(bandOf(sg)));
  addFacet(data, 'espectro', espectro, (r) => byParty[r[fi.partido]], true);

  // Patrimônio: resumo [total, máscara de grupos, nº de bens] por SQ_CANDIDATO (ver fetch-bens.mjs)
  if (wealthJson) {
    const c = wealthJson.c;
    data.wealth = raw.rows.map((r) => c[r[COL.sq]] ?? null);
    data.wealthGen = wealthJson.gen;
    addFacet(data, 'patrim', WEALTH_LABELS, (r, i) => wealthBand(data.wealth[i]?.[0] ?? -1));
    addFacet(data, 'bens', wealthJson.groups, (r, i) => data.wealth[i]?.[1] ?? 0);
    data.multi.bens = true;
  }
  return data;
}

// Faceta derivada: vira uma coluna extra no fim de cada linha. Com dropLastIfEmpty, o último rótulo
// (ex.: "Sem classificação") some quando nenhuma linha cai nele.
function addFacet(data, k, labels, valueOf, dropLastIfEmpty = false) {
  const col = data.rows[0]?.length ?? 0;
  let usedLast = false;
  data.rows.forEach((r, i) => {
    r[col] = valueOf(r, i);
    if (r[col] === labels.length - 1) usedLast = true;
  });
  data.fi[k] = col;
  data.keys.push(k);
  data.dicts[k] = dropLastIfEmpty && !usedLast ? labels.slice(0, -1) : labels;
}

// Índices de um dicionário na ordem de exibição (sem valores vazios)
export function orderOf(data, k) {
  const d = data.dicts[k];
  const idx = d.map((_, i) => i).filter((i) => d[i] !== '');
  if (ORDER[k]) idx.sort((a, b) => ORDER[k].indexOf(d[a]) - ORDER[k].indexOf(d[b]));
  if (k === 'uf') idx.sort((a, b) => (d[a] === 'BR') - (d[b] === 'BR') || d[a].localeCompare(d[b]));
  return idx;
}
