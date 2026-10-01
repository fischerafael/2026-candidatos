import { FACETS } from '../lib/constants.js';
import { useData } from '../lib/data.js';
import Facet from './Facet.jsx';

export default function Filters({
  open, sel, counts, toggle, amin, amax, setAmin, setAmax, setAge, wmin, wmax, setWmin, setWmax, clearAll, nActive,
}) {
  const data = useData();
  return (
    <aside className={`filters${open ? ' open' : ''}`} aria-label="Filtros">
      <div className="fhead">
        <h2>Filtros</h2>
        <button className="linkbtn" disabled={!nActive} onClick={clearAll}>Limpar tudo</button>
      </div>
      {FACETS.filter((f) => f.type === 'age' || data.keys.includes(f.k)).map((f) => (
        <Facet key={f.k} f={f} sel={sel[f.k] || []} counts={counts[f.k]} toggle={toggle}
          amin={amin} amax={amax} setAmin={setAmin} setAmax={setAmax} setAge={setAge}
          wmin={wmin} wmax={wmax} setWmin={setWmin} setWmax={setWmax} />
      ))}
    </aside>
  );
}
