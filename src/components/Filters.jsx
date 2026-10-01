import { FACETS } from '../lib/constants.js';
import Facet from './Facet.jsx';

export default function Filters({ open, sel, counts, toggle, amin, amax, setAmin, setAmax, setAge, clearAll, nActive }) {
  return (
    <aside className={`filters${open ? ' open' : ''}`} aria-label="Filtros">
      <div className="fhead">
        <h2>Filtros</h2>
        <button className="linkbtn" disabled={!nActive} onClick={clearAll}>Limpar tudo</button>
      </div>
      {FACETS.map((f) => (
        <Facet key={f.k} f={f} sel={sel[f.k] || []} counts={counts[f.k]} toggle={toggle}
          amin={amin} amax={amax} setAmin={setAmin} setAmax={setAmax} setAge={setAge} />
      ))}
    </aside>
  );
}
