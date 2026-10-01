// Baixa e extrai as fotos de candidatos publicadas pelo TSE, por estado.
//
//   npm run fotos -- PR            baixa só o Paraná
//   npm run fotos -- PR SC BR      vários estados (BR = presidente e vice)
//   npm run fotos -- all           todos os estados
//   npm run fotos -- --zip ~/Downloads/foto_cand2026_PR_div.zip   usa um zip já baixado
//   npm run fotos -- PR --force    baixa de novo mesmo se o zip já estiver em cache
//
// Resultado: public/fotos/<SQ_CANDIDATO>.jpg e public/fotos/index.json (lista de quem tem foto).
import AdmZip from 'adm-zip';
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(root, 'public/fotos');
const CACHE = resolve(root, '.cache');
const BASE_URL = process.env.TSE_PHOTO_BASE_URL
  || 'https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2026/fotos';
const ALL_UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'BR', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB',
  'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];

const args = process.argv.slice(2);
const force = args.includes('--force');
const zips = [];
const ufs = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--force') continue;
  if (a === '--zip') { zips.push(resolve(args[++i])); continue; }
  if (a.toLowerCase() === 'all') { ufs.push(...ALL_UFS); continue; }
  const uf = a.toUpperCase();
  if (!ALL_UFS.includes(uf)) { console.error(`UF desconhecida: ${a}`); process.exit(1); }
  ufs.push(uf);
}
if (!ufs.length && !zips.length) {
  console.error('Informe ao menos uma UF (ex.: npm run fotos -- PR) ou --zip caminho.zip');
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
mkdirSync(CACHE, { recursive: true });

const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

async function download(uf) {
  const name = `foto_cand2026_${uf}_div.zip`;
  const dest = resolve(CACHE, name);
  if (existsSync(dest) && !force) {
    console.log(`${uf}: usando cache (${basename(dest)})`);
    return dest;
  }
  const url = `${BASE_URL}/${name}`;
  process.stdout.write(`${uf}: baixando ${url} … `);
  const res = await fetch(url, { signal: AbortSignal.timeout(180_000) });
  if (!res.ok) throw new Error(`${uf}: HTTP ${res.status} ao baixar ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  console.log(mb(buf.length));
  return dest;
}

// Os arquivos do TSE vêm nomeados como F<UF><SQ_CANDIDATO>_div.jpg (ex.: FPR160002541234_div.jpg).
// Extraímos o SQ (sequência longa de dígitos) para não depender do prefixo exato.
const SQ_RE = /(\d{9,})/;

function extract(zipPath) {
  const zip = new AdmZip(zipPath);
  let n = 0;
  let skipped = 0;
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory || !/\.jpe?g$/i.test(entry.entryName)) continue;
    const m = SQ_RE.exec(basename(entry.entryName));
    if (!m) { skipped++; continue; }
    writeFileSync(resolve(OUT, `${m[1]}.jpg`), entry.getData());
    n++;
  }
  console.log(`  ${n} fotos extraídas de ${basename(zipPath)}${skipped ? ` (${skipped} ignoradas sem SQ no nome)` : ''}`);
}

function writeIndex() {
  const files = readdirSync(OUT).filter((f) => /^\d+\.jpg$/.test(f));
  const total = files.reduce((s, f) => s + statSync(resolve(OUT, f)).size, 0);
  const ids = files.map((f) => f.slice(0, -4)).sort();
  writeFileSync(resolve(OUT, 'index.json'), JSON.stringify(ids));
  console.log(`\npublic/fotos: ${ids.length} fotos no total (${mb(total)}). Índice atualizado.`);
}

let failed = 0;
for (const uf of ufs) {
  try { extract(await download(uf)); } catch (e) { failed++; console.error(`\n${e.message}`); }
}
for (const z of zips) {
  try { extract(z); } catch (e) { failed++; console.error(`${basename(z)}: ${e.message}`); }
}
writeIndex();
if (failed) process.exitCode = 1;
