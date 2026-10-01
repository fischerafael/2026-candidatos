import { useEffect, useState } from 'react';
import { loadByUf } from '../lib/data.js';

const NAMES = {
  instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', x: 'X', facebook: 'Facebook',
  threads: 'Threads', kwai: 'Kwai', linkedin: 'LinkedIn', site: 'Site',
};

// Redes sociais declaradas ao TSE (ver scripts/fetch-redes.mjs). Some se o candidato não tiver nenhuma.
export default function Redes({ sq, uf }) {
  const [links, setLinks] = useState(null);

  useEffect(() => {
    let alive = true;
    setLinks(null);
    loadByUf('redes', uf)
      .then((d) => alive && setLinks((d.c[sq] || []).map(([p, label, url]) => [d.platforms[p], label, url])))
      .catch(() => alive && setLinks([]));
    return () => { alive = false; };
  }, [sq, uf]);

  if (!links?.length) return null;
  return (
    <>
      <hr />
      <section className="redes">
        <h3>Redes sociais</h3>
        <ul>
          {links.map(([p, label, url]) => (
            <li key={url}>
              <a href={url} target="_blank" rel="noopener noreferrer nofollow">
                <b>{NAMES[p] || p}</b>
                {label && <span>{label}</span>}
              </a>
            </li>
          ))}
        </ul>
        <p className="fnote">Links informados pelo candidato ao TSE, padronizados. Fonte: TSE.</p>
      </section>
    </>
  );
}
