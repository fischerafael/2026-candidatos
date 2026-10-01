import { useState } from 'react';
import { AGE_PRESETS, UF_NAME } from '../lib/constants.js';
import { orderOf, useData } from '../lib/data.js';
import { fmt, norm } from '../lib/format.js';
import { IDEOLOGY_SOURCE, scoreLabel } from '../lib/ideology.js';
import { parseMoney } from '../lib/patrimonio.js';

export default function Facet({
  f, sel, counts, toggle, amin, amax, setAmin, setAmax, setAge, wmin, wmax, setWmin, setWmax,
}) {
  const data = useData();
  const n = f.type === 'age' ? (amin !== '' || amax !== '' ? 1 : 0)
    : sel.length + (f.type === 'wealth' && (wmin !== '' || wmax !== '') ? 1 : 0);

  let body;
  if (f.type === 'age') {
    body = <AgeRange amin={amin} amax={amax} setAmin={setAmin} setAmax={setAmax} setAge={setAge} />;
  } else {
    const d = data.dicts[f.k];
    let idx = orderOf(data, f.k);
    if (f.sortByCount) idx = idx.slice().sort((a, b) => counts[b] - counts[a] || d[a].localeCompare(d[b]));
    if (f.type === 'uf' || f.type === 'chips') {
      body = (
        <div className={f.type === 'uf' ? 'grid-uf' : 'chips-wrap'}>
          {idx.map((i) => (
            <button key={i} className="chip"
              title={f.type === 'uf' ? UF_NAME[d[i]] : `${data.party[d[i]] || d[i]} · ${scoreLabel(d[i])}`}
              aria-pressed={sel.includes(i)}
              disabled={!counts[i] && !sel.includes(i)}
              onClick={() => toggle(f.k, i)}>
              {d[i]}<small>{fmt(counts[i])}</small>
            </button>
          ))}
        </div>
      );
    } else {
      body = <CheckboxList f={f} idx={idx} d={d} sel={sel} counts={counts} toggle={toggle} />;
    }
    if (f.type === 'wealth') {
      body = <>{body}<WealthRange wmin={wmin} wmax={wmax} setWmin={setWmin} setWmax={setWmax} /></>;
    }
    if (f.note) {
      body = <>{body}<p className="fnote">{f.note}</p></>;
    }
    if (f.type === 'ideology') {
      body = (
        <>
          {body}
          <p className="fnote">
            Posição do partido, não do candidato, numa escala de 0 (esquerda) a 10 (direita).
            Fonte: <a href={IDEOLOGY_SOURCE.url} target="_blank" rel="noreferrer">{IDEOLOGY_SOURCE.label}</a>.
            Critérios completos no rodapé da página.
          </p>
        </>
      );
    }
  }

  return (
    <details className="fs" open={f.open || n > 0}>
      <summary><span>{f.label}{n > 0 && <span className="n">{n}</span>}</span></summary>
      <div className="fbody">{body}</div>
    </details>
  );
}

function CheckboxList({ f, idx, d, sel, counts, toggle }) {
  const [all, setAll] = useState(false);
  const [fq, setFq] = useState('');
  const label = (i) => (f.k === 'ufnasc' ? UF_NAME[d[i]] || d[i] : d[i]);

  let shown = idx;
  if (f.type === 'search') {
    const t = norm(fq.trim());
    if (t) shown = idx.filter((i) => norm(label(i)).includes(t) || norm(d[i]).includes(t));
    shown = [...shown.filter((i) => sel.includes(i)), ...shown.filter((i) => !sel.includes(i))];
  }
  const cap = f.type === 'search' && !all && !fq ? 8 : Infinity;

  return (
    <>
      {f.type === 'search' && (
        <input className="mini-search" value={fq} onChange={(e) => setFq(e.target.value)}
          placeholder={f.k === 'ocup' ? 'Buscar ocupação' : 'Buscar estado'} aria-label={`Buscar em ${f.label}`} />
      )}
      {shown.slice(0, cap).map((i) => (
        <label key={i} className={`opt${!counts[i] && !sel.includes(i) ? ' zero' : ''}`}>
          <input type="checkbox" checked={sel.includes(i)} onChange={() => toggle(f.k, i)} />
          <span className="lbl">{label(i)}</span>
          <span className="c">{fmt(counts[i])}</span>
        </label>
      ))}
      {shown.length > cap && <button className="more" onClick={() => setAll(true)}>Ver todas ({shown.length})</button>}
      {f.type === 'search' && shown.length === 0 && (
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>Nada encontrado.</div>
      )}
    </>
  );
}

function AgeRange({ amin, amax, setAmin, setAmax, setAge }) {
  return (
    <>
      <div className="range">
        <label>Mínima
          <input type="number" inputMode="numeric" min="18" max="100" value={amin} placeholder="18"
            onChange={(e) => setAmin(e.target.value)} />
        </label>
        <label>Máxima
          <input type="number" inputMode="numeric" min="18" max="100" value={amax} placeholder="92"
            onChange={(e) => setAmax(e.target.value)} />
        </label>
      </div>
      <div className="presets">
        {AGE_PRESETS.map(([a, b, l]) => {
          const on = String(a) === amin && String(b) === amax;
          return (
            <button key={l} className="chip" aria-pressed={on}
              onClick={() => (on ? setAge('', '') : setAge(String(a), String(b)))}>{l}</button>
          );
        })}
      </div>
    </>
  );
}

// Faixa livre de patrimônio: aceita "500 mil", "1,5 mi", "250.000" etc. (ver parseMoney)
function WealthRange({ wmin, wmax, setWmin, setWmax }) {
  const bad = (v) => Number.isNaN(parseMoney(v));
  return (
    <div className="wealth-range">
      <div className="range">
        <label>De
          <input type="text" inputMode="text" value={wmin} placeholder="R$ 0" aria-invalid={bad(wmin)}
            onChange={(e) => setWmin(e.target.value)} />
        </label>
        <label>Até
          <input type="text" inputMode="text" value={wmax} placeholder="sem limite" aria-invalid={bad(wmax)}
            onChange={(e) => setWmax(e.target.value)} />
        </label>
      </div>
      <p className="fnote">Faixa livre: digite valores como 500 mil, 1,5 mi ou 250.000. Esconde quem não declarou.</p>
    </div>
  );
}
