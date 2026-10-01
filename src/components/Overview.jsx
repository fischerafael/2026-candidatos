import { AGE_BUCKETS, SHORT } from '../lib/constants.js';
import { orderOf, useData } from '../lib/data.js';
import Bars from './Bars.jsx';

const isWide = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 901px)').matches;

export default function Overview({ counts, ageCounts, sel, toggle, amin, amax, setAge }) {
  const data = useData();

  const items = (k, { byCount = false, top } = {}) => {
    const d = data.dicts[k];
    let idx = orderOf(data, k).filter((i) => d[i] !== 'Não divulgável');
    if (byCount) idx = idx.slice().sort((a, b) => counts[k][b] - counts[k][a]);
    if (top) idx = idx.slice(0, top);
    return idx.map((i) => ({
      label: SHORT[d[i]] || d[i], full: d[i], v: counts[k][i], on: (sel[k] || []).includes(i), k, i,
    }));
  };
  const onFacet = (x) => toggle(x.k, x.i);

  const ages = AGE_BUCKETS.map(([a, b, label], j) => {
    const max = b === 120 ? '' : String(b);
    return { label, v: ageCounts[j], on: amin === String(a) && amax === max, a: String(a), b: max };
  });
  const onAge = (x) => (x.on ? setAge('', '') : setAge(x.a, x.b));

  return (
    <details className="panel" open={isWide()}>
      <summary><span>Panorama do recorte</span><small>Clique numa barra para filtrar</small></summary>
      <div className="charts">
        <Bars title="Cargo" items={items('cargo').filter((x) => x.v > 0 || x.on)} onClick={onFacet} />
        <Bars title="Partidos com mais candidaturas" items={items('partido', { byCount: true, top: 8 })} onClick={onFacet} />
        <Bars title="Espectro do partido" items={items('espectro')} onClick={onFacet} />
        {data.dicts.patrim && <Bars title="Patrimônio declarado" items={items('patrim')} onClick={onFacet} />}
        <Bars title="Gênero" items={items('genero')} onClick={onFacet} />
        <Bars title="Cor/raça" items={items('raca', { byCount: true })} onClick={onFacet} />
        <Bars title="Escolaridade" items={items('instr')} onClick={onFacet} />
        <Bars title="Faixa etária" items={ages} onClick={onAge} />
      </div>
    </details>
  );
}
