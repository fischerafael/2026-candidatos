import { useState } from 'react';
import { photoUrl, useData } from '../lib/data.js';

const initials = (name) => name.replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter(Boolean)
  .slice(0, 2).map((w) => w[0]).join('').toUpperCase();

// Foto 3:4 do candidato. Sem foto no índice (ou se o arquivo falhar), mostra as iniciais.
export default function Photo({ sq, name, className = '' }) {
  const { photos } = useData();
  const [failed, setFailed] = useState(false);
  const has = photos.has(sq) && !failed;
  return (
    <span className={`photo ${className}${has ? '' : ' none'}`}>
      {has
        ? <img src={photoUrl(sq)} alt={`Foto de ${name}`} loading="lazy" decoding="async" onError={() => setFailed(true)} />
        : <span aria-hidden="true">{initials(name)}</span>}
    </span>
  );
}
