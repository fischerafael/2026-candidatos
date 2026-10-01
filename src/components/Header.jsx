import { fmt } from '../lib/format.js';
import { FilterIcon, SearchIcon } from './Icons.jsx';

export default function Header({ total, shown, q, setQ, nActive, onOpenFilters }) {
  return (
    <header className="top">
      <div className="brand">
        <div>
          <h1>Candidatos 2026</h1>
          <p>Todas as candidaturas registradas no TSE para as eleições gerais de 4 de outubro. Busque por nome ou número e cruze filtros à vontade.</p>
        </div>
        <div className="total"><b>{fmt(shown)}</b><span>de {fmt(total)}</span></div>
      </div>
      <div className="searchrow">
        <label className="search">
          <SearchIcon />
          <input type="search" placeholder="Nome de urna, nome completo ou número" value={q}
            onChange={(e) => setQ(e.target.value)} aria-label="Buscar candidato" />
        </label>
        <button className="btn only-mobile" onClick={onOpenFilters}>
          <FilterIcon /> Filtros{nActive ? ` (${nActive})` : ''}
        </button>
      </div>
    </header>
  );
}
