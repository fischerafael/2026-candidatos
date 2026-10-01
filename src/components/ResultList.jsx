import { PAGE_STEP, SORTS, UF_NAME } from '../lib/constants.js';
import { useData } from '../lib/data.js';
import { fmt } from '../lib/format.js';
import { money } from '../lib/patrimonio.js';
import Digits from './Digits.jsx';
import Photo from './Photo.jsx';

export default function ResultList({
  sorted, limit, setLimit, sort, setSort, onOpen, clearAll,
  view, setView, onlyPhoto, setOnlyPhoto, hasPhotos,
}) {
  const hasWealth = !!useData().wealth;
  const remaining = sorted.length - limit;
  const Item = view === 'grid' ? Card : Row;
  return (
    <>
      <div className="toolbar">
        <div className="count">{fmt(sorted.length)} <span>{sorted.length === 1 ? 'candidatura' : 'candidaturas'}</span></div>
        <div className="toolbar-controls">
          {hasPhotos && (
            <label className="toggle">
              <input type="checkbox" checked={onlyPhoto} onChange={(e) => setOnlyPhoto(e.target.checked)} />
              Só com foto
            </label>
          )}
          <div className="seg" role="group" aria-label="Modo de exibição">
            <button aria-pressed={view === 'list'} onClick={() => setView('list')}>Lista</button>
            <button aria-pressed={view === 'grid'} onClick={() => setView('grid')}>Fotos</button>
          </div>
          <label>
            <span className="sr-only">Ordenar por</span>
            <select className="sel" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar por">
              {SORTS.filter(([v]) => hasWealth || (v !== 'rich' && v !== 'poor'))
                .map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className={view === 'grid' ? 'gallery' : 'list'}>
        {sorted.length === 0 ? (
          <div className="empty">
            <h3>Nenhuma candidatura com esses critérios</h3>
            <p>Remova algum filtro ou ajuste a busca para ver resultados.</p>
            <button className="btn fix" onClick={clearAll}>Limpar filtros</button>
          </div>
        ) : (
          sorted.slice(0, limit).map((r, pos) => <Item key={r} r={r} onOpen={() => onOpen(pos)} />)
        )}
      </div>
      {remaining > 0 && (
        <div className="loadmore">
          <button className="btn" onClick={() => setLimit((l) => l + PAGE_STEP)}>
            Mostrar mais ({fmt(Math.min(PAGE_STEP, remaining))} de {fmt(remaining)} restantes)
          </button>
        </div>
      )}
    </>
  );
}

function useRow(r) {
  const { rows, dicts, fi, wealth } = useData();
  const row = rows[r];
  const w = wealth?.[r];
  const uf = dicts.uf[row[fi.uf]];
  return {
    row,
    cargo: dicts.cargo[row[fi.cargo]],
    partido: dicts.partido[row[fi.partido]],
    place: UF_NAME[uf] || uf,
    patrim: w ? money(w[0]) : '',
  };
}

function Row({ r, onOpen }) {
  const { row, cargo, partido, place, patrim } = useRow(r);
  return (
    <button className="row" onClick={onOpen}>
      <Photo sq={row[20]} name={row[1]} className="sm" />
      <Digits n={row[0]} />
      <div className="who">
        <div className="urna">{row[1]}</div>
        <div className="full">{row[3] || row[2]}</div>
        <div className="meta"><span>{cargo}</span><span>{place}</span></div>
      </div>
      <div className="side">
        <span className="pill">{partido}</span>
        <b>{row[4] >= 0 ? `${row[4]} anos` : ''}</b>
        {patrim && <span className="patrim" title="Patrimônio declarado">{patrim}</span>}
      </div>
    </button>
  );
}

function Card({ r, onOpen }) {
  const { row, cargo, partido, place } = useRow(r);
  return (
    <button className="card" onClick={onOpen}>
      <Photo sq={row[20]} name={row[1]} className="lg" />
      <span className="card-body">
        <span className="card-top"><span className="pill">{partido}</span><span className="card-num">{row[0]}</span></span>
        <span className="card-name">{row[1]}</span>
        <span className="card-meta">{cargo} · {place}</span>
      </span>
    </button>
  );
}
