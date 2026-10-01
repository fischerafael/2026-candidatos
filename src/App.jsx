import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { DataProvider, useCandidatosData } from './lib/data.js';
import { readHash, writeHash } from './lib/urlState.js';
import { useFilteredData, useSorted } from './lib/useFilteredData.js';
import { PAGE_SIZE } from './lib/constants.js';
import { fmt } from './lib/format.js';
import Header from './components/Header.jsx';
import Filters from './components/Filters.jsx';
import ActiveTags from './components/ActiveTags.jsx';
import Overview from './components/Overview.jsx';
import ResultList from './components/ResultList.jsx';
import CandidateDrawer from './components/CandidateDrawer.jsx';

export default function App() {
  const { status, data, error } = useCandidatosData();
  if (status === 'loading') return <div className="loading">Carregando candidaturas…</div>;
  if (status === 'error') {
    return (
      <div className="loading error">
        Não foi possível carregar public/data/candidatos.json ({String(error.message)}).
        <br />Rode <code>npm run prepare-data -- caminho/do/arquivo.csv</code> e recarregue a página.
      </div>
    );
  }
  return (
    <DataProvider value={data}>
      <Explorer data={data} />
    </DataProvider>
  );
}

function Explorer({ data }) {
  const init = useMemo(() => readHash(data), [data]);
  const [q, setQ] = useState(init.q);
  const [sel, setSel] = useState(init.sel);
  const [amin, setAmin] = useState(init.amin);
  const [amax, setAmax] = useState(init.amax);
  const [sort, setSort] = useState(init.sort);
  const [onlyPhoto, setOnlyPhoto] = useState(init.onlyPhoto);
  const [view, setView] = useState(init.view);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [openPos, setOpenPos] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // valores adiados mantêm a digitação fluida enquanto o filtro roda
  const dq = useDeferredValue(q);
  const dsel = useDeferredValue(sel);

  useEffect(() => writeHash(data, { q: dq, sel: dsel, amin, amax, sort, onlyPhoto, view }),
    [data, dq, dsel, amin, amax, sort, onlyPhoto, view]);
  useEffect(() => setLimit(PAGE_SIZE), [dq, dsel, amin, amax, sort, onlyPhoto]);
  useEffect(() => {
    document.body.style.overflow = openPos !== null || sheetOpen ? 'hidden' : '';
  }, [openPos, sheetOpen]);

  const { ids, counts, ageCounts } = useFilteredData(data, { q: dq, sel: dsel, amin, amax, onlyPhoto });
  const sorted = useSorted(data, ids, sort);

  const toggle = useCallback((k, i) => {
    setSel((s) => {
      const cur = s[k] || [];
      const next = cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i];
      const o = { ...s };
      if (next.length) o[k] = next;
      else delete o[k];
      return o;
    });
  }, []);
  const setAge = useCallback((a, b) => { setAmin(a); setAmax(b); }, []);
  const clearAll = useCallback(() => { setSel({}); setQ(''); setAge('', ''); }, [setAge]);

  const nActive = Object.values(sel).reduce((s, v) => s + v.length, 0)
    + (amin !== '' || amax !== '' ? 1 : 0) + (q ? 1 : 0);

  return (
    <>
      <div className="wrap">
        <Header total={data.rows.length} shown={ids.length} q={q} setQ={setQ}
          nActive={nActive} onOpenFilters={() => setSheetOpen(true)} />
        <div className="layout">
          <Filters open={sheetOpen} sel={sel} counts={counts} toggle={toggle}
            amin={amin} amax={amax} setAmin={setAmin} setAmax={setAmax} setAge={setAge}
            clearAll={clearAll} nActive={nActive} />
          <main>
            <ActiveTags sel={sel} toggle={toggle} q={q} setQ={setQ} amin={amin} amax={amax}
              setAge={setAge} clearAll={clearAll} nActive={nActive} />
            <Overview counts={counts} ageCounts={ageCounts} sel={sel} toggle={toggle}
              amin={amin} amax={amax} setAge={setAge} />
            <ResultList sorted={sorted} limit={limit} setLimit={setLimit} sort={sort} setSort={setSort}
              onOpen={setOpenPos} clearAll={clearAll} view={view} setView={setView}
              onlyPhoto={onlyPhoto} setOnlyPhoto={setOnlyPhoto} hasPhotos={data.photos.size > 0} />
            <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 24 }}>
              Fonte: TSE, consulta de candidatos 2026 (arquivo gerado em {data.gen}). Idade calculada na data da eleição.
            </p>
          </main>
        </div>
      </div>
      {sheetOpen && (
        <div className="sheetbar">
          <button className="btn fix" onClick={clearAll}>Limpar</button>
          <button className="btn go" onClick={() => setSheetOpen(false)}>Ver {fmt(ids.length)} resultados</button>
        </div>
      )}
      {openPos !== null && sorted[openPos] !== undefined && (
        <CandidateDrawer r={sorted[openPos]} pos={openPos} total={sorted.length}
          onClose={() => setOpenPos(null)}
          onPrev={() => setOpenPos((p) => Math.max(0, p - 1))}
          onNext={() => setOpenPos((p) => Math.min(sorted.length - 1, p + 1))} />
      )}
    </>
  );
}
