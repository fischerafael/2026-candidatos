import { useMemo } from 'react';
import { AGE_BUCKETS } from './constants.js';
import { norm } from './format.js';

const bucketOf = (age) => AGE_BUCKETS.findIndex(([a, b]) => age >= a && age <= b);

/**
 * Aplica busca + filtros e calcula contagens "cruzadas": a contagem de cada opção
 * considera todos os filtros ativos exceto o da própria categoria. Assim a lateral
 * mostra quantos resultados haveria ao marcar aquela opção.
 * Uma única passada sobre os dados: se a linha falha em 0 filtros, entra no resultado
 * e soma em todas as categorias; se falha em exatamente 1, soma só nessa categoria.
 */
export function useFilteredData(data, { q, sel, amin, amax, onlyPhoto }) {
  return useMemo(() => {
    const { rows, keys, dicts, fi, search, photos } = data;
    const needPhoto = onlyPhoto && photos.size > 0;
    const terms = norm(q.trim()).split(/\s+/).filter(Boolean);
    const active = keys.filter((k) => sel[k]?.length).map((k) => ({ k, col: fi[k], set: new Set(sel[k]) }));
    const lo = amin === '' ? -Infinity : Number(amin);
    const hi = amax === '' ? Infinity : Number(amax);
    const ageOn = amin !== '' || amax !== '';

    const counts = Object.fromEntries(keys.map((k) => [k, new Uint32Array(dicts[k].length)]));
    const ageCounts = new Uint32Array(AGE_BUCKETS.length);
    const ids = [];

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (terms.length && !terms.every((t) => search[r].includes(t))) continue;
      if (needPhoto && !photos.has(row[20])) continue;

      let fails = 0;
      let failK = null;
      for (const a of active) {
        if (!a.set.has(row[a.col])) { fails++; failK = a.k; if (fails > 1) break; }
      }
      if (fails > 1) continue;

      const age = row[4];
      const ageFail = ageOn && (age < lo || age > hi);
      if (fails === 1 && ageFail) continue;

      if (fails === 0) {
        const b = bucketOf(age);
        if (b >= 0) ageCounts[b]++;
        if (ageFail) continue;
        ids.push(r);
        for (const k of keys) counts[k][row[fi[k]]]++;
      } else {
        counts[failK][row[fi[failK]]]++;
      }
    }
    return { ids, counts, ageCounts };
  }, [data, q, sel, amin, amax, onlyPhoto]);
}

export function useSorted(data, ids, sort) {
  return useMemo(() => {
    const { rows, dicts, fi } = data;
    const coll = new Intl.Collator('pt-BR');
    const byName = (x, y) => coll.compare(rows[x][1], rows[y][1]);
    const comparators = {
      urna: byName,
      young: (x, y) => rows[x][4] - rows[y][4] || byName(x, y),
      old: (x, y) => rows[y][4] - rows[x][4] || byName(x, y),
      num: (x, y) => rows[x][0] - rows[y][0],
      partido: (x, y) => coll.compare(dicts.partido[rows[x][fi.partido]], dicts.partido[rows[y][fi.partido]]) || byName(x, y),
      uf: (x, y) => coll.compare(dicts.uf[rows[x][fi.uf]], dicts.uf[rows[y][fi.uf]]) || byName(x, y),
    };
    return ids.slice().sort(comparators[sort] || byName);
  }, [data, ids, sort]);
}
