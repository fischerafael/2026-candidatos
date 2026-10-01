// Baixa as redes sociais declaradas pelos candidatos ao TSE e gera os arquivos do app.
//
//   npm run redes                        baixa rede_social_candidato_2026.zip (ou usa o cache em .cache/)
//   npm run redes -- --force             baixa de novo mesmo com cache
//   npm run redes -- --zip arquivo.zip   usa um zip já baixado
//   npm run redes -- --csv rede_social_candidato_2026_BRASIL.csv
//
// Saída: public/data/redes/<UF>.json, com os links de cada candidato já normalizados,
// carregado só ao abrir a ficha.
//
// O campo do TSE é texto livre (URL, "@usuario", "INSTAGRAM: FULANO"…) e ~2/3 vêm em maiúsculas.
// Por isso só entram links que dá para reconstruir com segurança: perfis cujo @usuário não diferencia
// maiúsculas (vai em minúsculas) e links com código que diferencia, mas só se não vierem em maiúsculas.
// Grupos e telefones de WhatsApp/Telegram ficam de fora.
import AdmZip from 'adm-zip';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readTseCsv } from './lib/tse-csv.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = resolve(root, '.cache');
const URL_ZIP = 'https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/rede_social_candidato_2026.zip';
const MAX_PER_CAND = 12;

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? resolve(args[i + 1]) : null; };

async function loadCsv() {
  const csv = opt('--csv');
  if (csv) return readFileSync(csv);
  let zipPath = opt('--zip');
  if (!zipPath) {
    mkdirSync(CACHE, { recursive: true });
    zipPath = resolve(CACHE, 'rede_social_candidato_2026.zip');
    if (!existsSync(zipPath) || args.includes('--force')) {
      process.stdout.write(`baixando ${URL_ZIP} … `);
      const res = await fetch(URL_ZIP, { signal: AbortSignal.timeout(180_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status} ao baixar ${URL_ZIP}`);
      writeFileSync(zipPath, Buffer.from(await res.arrayBuffer()));
      console.log('ok');
    } else console.log('usando cache (.cache/rede_social_candidato_2026.zip)');
  }
  const entry = new AdmZip(zipPath).getEntries().find((e) => /_BRASIL\.csv$/i.test(e.entryName));
  if (!entry) throw new Error('CSV *_BRASIL.csv não encontrado no zip');
  return entry.getData();
}

// Plataformas na ordem em que aparecem na ficha
const PLATFORMS = ['instagram', 'tiktok', 'youtube', 'x', 'facebook', 'threads', 'kwai', 'linkedin', 'site'];
const HOSTS = {
  'instagram.com': 'instagram', 'instagr.am': 'instagram',
  'tiktok.com': 'tiktok',
  'youtube.com': 'youtube', 'youtu.be': 'youtube',
  'x.com': 'x', 'twitter.com': 'x',
  'facebook.com': 'facebook', 'fb.com': 'facebook', 'fb.me': 'facebook',
  'threads.net': 'threads', 'threads.com': 'threads',
  'kwai.com': 'kwai',
  'linkedin.com': 'linkedin',
};
const CI_PATH_HOSTS = new Set(['linktr.ee', 'beacons.ai', 'bio.link', 'linkbio.co', 'linkme.bio', 'campsite.bio']);
const SKIP_HOST =/(^|\.)(whatsapp\.com|wa\.me|t\.me|telegram\.me|telegram\.org)$/;
const HANDLE = /^[\w.-]+$/;

// "INSTAGRAM: https://…", "TIKTOK - FULANO" → [plataforma sugerida, resto]
const NAMES = 'instagram|insta|facebook|face|tiktok|tik tok|youtube|twitter|threads|kwai|linkedin';
const LABEL = new RegExp(`^(?:(${NAMES})\\s*[:-]?\\s+|(${NAMES}|x)\\s*[:-]\\s*)`, 'i');
const LABEL_TO = { insta: 'instagram', face: 'facebook', 'tik tok': 'tiktok', twitter: 'x' };
const PROFILE_URL = {
  instagram: (h) => `https://www.instagram.com/${h}/`,
  tiktok: (h) => `https://www.tiktok.com/@${h}`,
  youtube: (h) => `https://www.youtube.com/@${h}`,
  x: (h) => `https://x.com/${h}`,
  threads: (h) => `https://www.threads.net/@${h}`,
  kwai: (h) => `https://www.kwai.com/@${h}`,
  facebook: (h) => `https://www.facebook.com/${h}`,
};
const RESERVED = new Set(['p', 'reel', 'reels', 'stories', 'share', 'watch', 'channel', 'c', 'user', 'video',
  'shorts', 'profile.php', 'people', 'pages', 'groups', 'events', 'hashtag', 'explore', 'in', 'company', 'home', 'intent', 'discover', 'tag', 'music', 'search', 'live']);

const profile = (p, raw) => {
  const h = raw.replace(/^@/, '').toLowerCase();
  return h && HANDLE.test(h) && !RESERVED.has(h) ? [p, `@${h}`, PROFILE_URL[p](h)] : null;
};

// Devolve [plataforma, rótulo, url] ou null quando não dá para montar um link confiável
function normalize(input) {
  let s = input.trim().replace(/\s+/g, ' ');
  let hint = null;
  const m = LABEL.exec(s);
  if (m) { const l = (m[1] || m[2]).toLowerCase(); hint = LABEL_TO[l] || l; s = s.slice(m[0].length).trim(); }
  if (!s) return null;
  // com a plataforma indicada, um "@usuario" sem domínio basta ("HTTPS://@FULANO", "HTTPS:// INSTAGRAM @FULANO")
  const at = /@([\w.-]+)/.exec(s);
  if (hint && PROFILE_URL[hint] && at && !/\.(com|net)\//i.test(s)) return profile(hint, at[1]);
  // URL no meio de outro texto ("FANPAGE HTTPS://…"): fica só a URL
  const inner = /https?:\/\/\S+/i.exec(s);
  if (inner) s = inner[0];
  const shouting = /[A-Z]/.test(s) && s === s.toUpperCase();

  // "@usuario" ou "usuario" solto: só com a plataforma indicada no próprio texto
  if (!/[/.]\w{2,}/.test(s.replace(/^@[\w.-]+$/, ''))) {
    return hint && PROFILE_URL[hint] && !/\s/.test(s) ? profile(hint, s) : null;
  }

  let url;
  try { url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`); } catch { return null; }
  const host = url.hostname.toLowerCase().replace(/^(www|m|mobile|web|pt-br|br)\./, '');
  if (SKIP_HOST.test(host) || !host.includes('.')) return null;
  const base = host.split('.').slice(-2).join('.');
  const p = HOSTS[host] || HOSTS[base];
  const seg = url.pathname.split('/').filter(Boolean);
  const first = seg[0] || '';
  const f = first.toLowerCase();
  // link com código que diferencia maiúsculas: sem parâmetros, e só se não veio todo em maiúsculas
  const keep = () => (shouting ? null : [p, null, `https://${host}${url.pathname}`]);

  switch (p) {
    case 'instagram': case 'threads': case 'x':
      return first ? profile(p, first) : null;
    case 'tiktok': case 'kwai':
      if (/^(vm|vt|k)\./.test(host)) return keep();
      return first && !first.includes('%') ? profile(p, first) : null; // tiktok.com/usuario, sem @
    case 'youtube':
      if (first.startsWith('@')) return profile(p, first);
      if ((f === 'c' || f === 'user') && seg[1]) return [p, seg[1].toLowerCase(), `https://www.youtube.com/${f}/${seg[1].toLowerCase()}`];
      if (f === 'channel' && seg[1]) return shouting ? null : [p, null, `https://www.youtube.com/channel/${seg[1]}`];
      if (host === 'youtu.be' || !first || RESERVED.has(first.toLowerCase()) || !HANDLE.test(first)) return null;
      return [p, first.toLowerCase(), `https://www.youtube.com/${first.toLowerCase()}`]; // youtube.com/nome antigo
    case 'facebook': {
      if (host === 'fb.me' || f === 'share') return keep();
      if (f === 'profile.php') {
        const id = url.searchParams.get('id') || url.searchParams.get('ID');
        return id && /^\d+$/.test(id) ? [p, null, `https://www.facebook.com/profile.php?id=${id}`] : null;
      }
      return first ? profile(p, first) : null;
    }
    case 'linkedin':
      return (f === 'in' || f === 'company') && seg[1]
        ? [p, null, `https://www.linkedin.com/${f}/${encodeURIComponent(decodeURIComponent(seg[1]).toLowerCase())}`] : null;
    default: {
      // site próprio, linktree etc., sem parâmetros de rastreamento. Em maiúsculas, o caminho só é
      // aproveitado (em minúsculas) em serviços onde ele não diferencia maiúsculas.
      let path = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
      if (shouting && path) {
        if (!CI_PATH_HOSTS.has(host)) return null;
        path = path.toLowerCase();
      }
      return ['site', host + path, `https://${host}${path}`];
    }
  }
}

const { rows, get } = readTseCsv(await loadCsv());
const byCand = new Map();
let kept = 0;
for (const r of rows) {
  const n = normalize(get(r, 'DS_URL'));
  if (!n) continue;
  const sq = get(r, 'SQ_CANDIDATO');
  let c = byCand.get(sq);
  if (!c) byCand.set(sq, (c = { uf: get(r, 'SG_UF'), links: new Map() }));
  const key = n[2].toLowerCase().replace(/\/$/, '');
  if (!c.links.has(key)) { c.links.set(key, n); kept++; }
}

const perUf = {};
for (const [sq, { uf, links }] of byCand) {
  const list = [...links.values()]
    .sort((a, b) => PLATFORMS.indexOf(a[0]) - PLATFORMS.indexOf(b[0]))
    .slice(0, MAX_PER_CAND)
    .map(([p, label, url]) => [PLATFORMS.indexOf(p), label, url]);
  (perUf[uf] ??= {})[sq] = list;
}

const outDir = resolve(root, 'public/data/redes');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
for (const [uf, c] of Object.entries(perUf)) {
  writeFileSync(resolve(outDir, `${uf}.json`), JSON.stringify({ platforms: PLATFORMS, c }));
}
console.log(`${kept} de ${rows.length} links aproveitados, ${byCand.size} candidatos → public/data/redes/ (${Object.keys(perUf).length} UFs)`);
