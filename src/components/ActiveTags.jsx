import { FACET_LABEL, UF_NAME } from '../lib/constants.js';
import { useData } from '../lib/data.js';
import { CloseIcon } from './Icons.jsx';

function Tag({ name, value, onRemove }) {
  return (
    <span className="tag">
      <em>{name}</em> {value}
      <button aria-label={`Remover ${value}`} onClick={onRemove}><CloseIcon /></button>
    </span>
  );
}

export default function ActiveTags({ sel, toggle, q, setQ, amin, amax, setAge, clearAll, nActive }) {
  const data = useData();
  if (!nActive) return <div className="active" />;
  return (
    <div className="active">
      {q && <Tag name="Busca" value={`“${q}”`} onRemove={() => setQ('')} />}
      {data.keys.flatMap((k) => (sel[k] || []).map((i) => {
        const v = data.dicts[k][i];
        const label = k === 'uf' || k === 'ufnasc' ? UF_NAME[v] || v : v;
        return <Tag key={`${k}-${i}`} name={FACET_LABEL[k]} value={label} onRemove={() => toggle(k, i)} />;
      }))}
      {(amin !== '' || amax !== '') && (
        <Tag name="Idade" value={`${amin || '18'}${amax ? `–${amax}` : '+'}`} onRemove={() => setAge('', '')} />
      )}
      <button className="linkbtn" onClick={clearAll} style={{ marginLeft: 4 }}>Limpar tudo</button>
    </div>
  );
}
