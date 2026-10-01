import { useEffect, useState } from 'react';
import { loadBens } from '../lib/data.js';
import { fmt } from '../lib/format.js';
import { money, moneyFull, WEALTH_NOTE } from '../lib/patrimonio.js';

const CAP = 8;

// Patrimônio declarado na ficha: total vem do resumo; a lista é baixada por estado ao abrir
export default function Bens({ sq, uf, summary }) {
  const [state, setState] = useState({ items: null, tipos: null, error: false });
  const [all, setAll] = useState(false);

  useEffect(() => {
    if (!summary) return undefined;
    let alive = true;
    setState({ items: null, tipos: null, error: false });
    setAll(false);
    loadBens(uf)
      .then((d) => alive && setState({ items: d.c[sq] || [], tipos: d.tipos, error: false }))
      .catch(() => alive && setState({ items: null, tipos: null, error: true }));
    return () => { alive = false; };
  }, [sq, uf, summary]);

  if (!summary) {
    return (
      <section className="bens">
        <h3>Patrimônio declarado</h3>
        <p className="bens-empty">Não declarou bens à Justiça Eleitoral.</p>
      </section>
    );
  }

  const [total, , n] = summary;
  const { items, tipos, error } = state;
  const shown = items && (all ? items : items.slice(0, CAP));
  return (
    <section className="bens">
      <h3>
        Patrimônio declarado
        <span className="bens-total" title={moneyFull(total)}>{money(total)}</span>
      </h3>
      <div className="bens-sub">{fmt(n)} {n === 1 ? 'bem declarado' : 'bens declarados'}</div>
      {error && <p className="bens-empty">Não foi possível carregar a lista de bens.</p>}
      {!items && !error && <p className="bens-empty">Carregando bens…</p>}
      {shown && (
        <ul className="bens-list">
          {shown.map(([t, desc, v], i) => (
            <li key={i}>
              <span className="bens-desc">
                <small>{tipos[t]}</small>
                {desc}
              </span>
              <span className="bens-v">{moneyFull(v)}</span>
            </li>
          ))}
        </ul>
      )}
      {items && items.length > CAP && !all && (
        <button className="more" onClick={() => setAll(true)}>Ver todos ({fmt(items.length)})</button>
      )}
      <p className="fnote">{WEALTH_NOTE} Números longos (CNPJ, contas etc.) foram ocultados. Fonte: TSE.</p>
    </section>
  );
}
