import { useEffect, useRef } from 'react';
import { COL, UF_NAME } from '../lib/constants.js';
import { useData } from '../lib/data.js';
import { track } from '../lib/track.js';
import { fmt, norm } from '../lib/format.js';
import { scoreLabel } from '../lib/ideology.js';
import Bens from './Bens.jsx';
import Digits from './Digits.jsx';
import Photo from './Photo.jsx';
import Redes from './Redes.jsx';

// Ficha do candidato, inspirada na tela e no teclado da urna eletrônica
export default function CandidateDrawer({ r, pos, total, onClose, onPrev, onNext }) {
  const { rows, dicts, fi, party, wealth } = useData();
  const row = rows[r];
  const g = (k) => dicts[k][row[fi[k]]];
  const closeRef = useRef(null);

  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => {
    track('ficha_aberta', { cargo: g('cargo'), partido: g('partido'), uf: g('uf') });
  }, [r]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); onNext(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); onPrev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNext, onPrev]);

  const uf = g('uf');
  const sg = g('partido');
  const fullParty = party[sg];
  const ufn = g('ufnasc');
  const fed = g('fed');

  return (
    <div>
      <div className="scrim" onClick={onClose} />
      <div className="drawer" role="dialog" aria-modal="true" aria-label={row[COL.urna]}>
        <div className="screen">
          <div className="screen-head">
            <div>
              <div className="lead">Candidatura para</div>
              <div className="office">{g('cargo')}</div>
              <div className="num"><span className="lead">Número</span><Digits n={row[COL.num]} /></div>
            </div>
            <Photo key={row[COL.sq]} sq={row[COL.sq]} name={row[COL.urna]} className="xl" />
          </div>
          <dl className="kv">
            <dt>Nome</dt><dd>{row[COL.urna]}</dd>
            <dt>Partido</dt>
            <dd>
              {sg}
              {fullParty && norm(fullParty) !== norm(sg) && (
                <span style={{ fontWeight: 400, color: 'var(--muted)' }}> {fullParty}</span>
              )}
            </dd>
            <dt>Espectro</dt>
            <dd style={{ fontWeight: 400 }}>{scoreLabel(sg)} <span style={{ color: 'var(--muted)' }}>· posição do partido</span></dd>
            <dt>Disputa em</dt><dd>{uf === 'BR' ? 'Todo o Brasil' : UF_NAME[uf]}</dd>
          </dl>
          <hr />
          <dl className="facts">
            <div className="wide"><dt>Nome completo</dt><dd>{row[COL.nome]}</dd></div>
            {row[COL.social] && <div className="wide"><dt>Nome social</dt><dd>{row[COL.social]}</dd></div>}
            <div><dt>Idade na eleição</dt><dd>{row[COL.age] >= 0 ? `${row[COL.age]} anos` : '—'}</dd></div>
            <div><dt>Nascimento</dt><dd>{row[COL.nasc] || '—'}{ufn ? ` · ${UF_NAME[ufn] || ufn}` : ''}</dd></div>
            <div><dt>Gênero</dt><dd>{g('genero')}</dd></div>
            <div><dt>Cor/raça</dt><dd>{g('raca')}</dd></div>
            <div><dt>Escolaridade</dt><dd>{g('instr')}</dd></div>
            <div><dt>Estado civil</dt><dd>{g('civil')}</dd></div>
            <div className="wide"><dt>Ocupação declarada</dt><dd>{g('ocup')}</dd></div>
            <div className="wide">
              <dt>Forma de concorrer</dt>
              <dd>{g('agrem')}{fed ? `: ${fed}` : ''}{row[COL.colig] ? `: ${row[COL.colig]}` : ''}</dd>
            </div>
            {row[COL.comp] && <div className="wide"><dt>Composição</dt><dd style={{ fontSize: 13 }}>{row[COL.comp]}</dd></div>}
          </dl>
          <Redes sq={row[COL.sq]} uf={uf} />
          {wealth && (
            <>
              <hr />
              <Bens sq={row[COL.sq]} uf={uf} summary={wealth[r]} />
            </>
          )}
        </div>
        <div className="keys">
          <button className="key k-w" onClick={onPrev} disabled={pos === 0}>Anterior</button>
          <button className="key k-o" onClick={onClose} ref={closeRef}>Fechar</button>
          <button className="key k-g" onClick={onNext} disabled={pos >= total - 1}>Próximo</button>
        </div>
        <div className="hint">{fmt(pos + 1)} de {fmt(total)} no recorte atual · use as setas do teclado</div>
      </div>
    </div>
  );
}
