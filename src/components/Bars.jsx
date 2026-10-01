import { fmt, pct } from '../lib/format.js';

// Barras horizontais clicáveis; o percentual é relativo à soma da própria categoria
export default function Bars({ title, items, onClick }) {
  const max = Math.max(1, ...items.map((x) => x.v));
  const total = items.reduce((s, x) => s + x.v, 0);
  return (
    <div className="chart">
      <h3>{title}</h3>
      {items.map((x) => (
        <button key={x.label} className={`bar${x.on ? ' on' : ''}`} onClick={() => onClick(x)}
          title={`${x.full || x.label}: ${fmt(x.v)} candidaturas`} aria-pressed={x.on}>
          <span className="t">{x.label}</span>
          <span className="track"><span className="fill" style={{ width: `${(x.v / max) * 100}%`, display: 'block' }} /></span>
          <span className="v">{pct(x.v, total)}</span>
        </button>
      ))}
    </div>
  );
}
