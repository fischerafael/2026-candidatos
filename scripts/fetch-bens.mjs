// Baixa a declaração de bens dos candidatos publicada pelo TSE e gera os arquivos do app.
//
//   npm run bens                     baixa bem_candidato_2026.zip (ou usa o cache em .cache/)
//   npm run bens -- --force          baixa de novo mesmo com cache
//   npm run bens -- --zip arquivo.zip   usa um zip já baixado
//   npm run bens -- --csv bem_candidato_2026_BRASIL.csv   usa o CSV já extraído
//
// Saída:
//   public/data/patrimonio.json   resumo por candidato, carregado com o app (total, grupos, nº de bens)
//   public/data/bens/<UF>.json    lista de bens por candidato, carregada só ao abrir a ficha
import AdmZip from 'adm-zip';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixDashes, readTseCsv } from './lib/tse-csv.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = resolve(root, '.cache');
const URL_ZIP = 'https://cdn.tse.jus.br/estatistica/sead/odsele/bem_candidato/bem_candidato_2026.zip';

// Grupos mostrados no filtro "Declarou ter", pelo código do tipo de bem da Receita (CD_TIPO_BEM_CANDIDATO)
const GROUPS = [
  ['Imóveis', [1, 2, 3, 11, 12, 13, 14, 15, 16, 17, 18, 19]],
  ['Veículos', [21]],
  ['Embarcações e aeronaves', [22, 23]],
  ['Participação em empresas', [32, 39]],
  ['Ações e fundos', [31, 47, 71, 72, 73, 74, 79]],
  ['Renda fixa, poupança e previdência', [41, 45, 49, 53, 54, 59, 97]],
  ['Contas bancárias', [61, 62, 69]],
  ['Dinheiro em espécie', [63, 64]],
  ['Ouro, joias e arte', [25, 46]],
  ['Outros bens e direitos', []], // todo código não listado acima
];
const OTHER = GROUPS.length - 1;
const groupOf = new Map(GROUPS.flatMap(([, codes], g) => codes.map((c) => [c, g])));

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? resolve(args[i + 1]) : null; };

async function loadCsv() {
  const csv = opt('--csv');
  if (csv) return readFileSync(csv);
  let zipPath = opt('--zip');
  if (!zipPath) {
    mkdirSync(CACHE, { recursive: true });
    zipPath = resolve(CACHE, 'bem_candidato_2026.zip');
    if (!existsSync(zipPath) || args.includes('--force')) {
      process.stdout.write(`baixando ${URL_ZIP} … `);
      const res = await fetch(URL_ZIP, { signal: AbortSignal.timeout(180_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status} ao baixar ${URL_ZIP}`);
      writeFileSync(zipPath, Buffer.from(await res.arrayBuffer()));
      console.log('ok');
    } else console.log('usando cache (.cache/bem_candidato_2026.zip)');
  }
  const entry = new AdmZip(zipPath).getEntries().find((e) => /_BRASIL\.csv$/i.test(e.entryName));
  if (!entry) throw new Error('CSV *_BRASIL.csv não encontrado no zip');
  return entry.getData();
}

const money = (s) => Number(s.replace(/\./g, '').replace(',', '.')) || 0;

// Esconde números longos (CNPJ, conta, matrícula, CEP…) mantendo valores em reais, datas e ano/modelo
function maskNumbers(s) {
  return s.replace(/\d[\d./-]*\d/g, (m) => {
    if (m.replace(/\D/g, '').length < 6) return m;
    if (/^\d{1,3}(\.\d{3})+$/.test(m)) return m; // 1.234.567
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(m)) return m; // 19/06/2023
    if (/^(19|20)\d{2}\/(19|20)\d{2}$/.test(m)) return m; // 2025/2026
    return '•••';
  });
}
const cleanDesc = (s) => maskNumbers(fixDashes(s)).replace(/\s+/g, ' ').trim();

const { rows, get } = readTseCsv(await loadCsv());
const tipos = [];
const tipoIdx = new Map();
const byCand = new Map(); // sq → { uf, items }
for (const r of rows) {
  const sq = get(r, 'SQ_CANDIDATO');
  const code = Number(get(r, 'CD_TIPO_BEM_CANDIDATO'));
  if (!tipoIdx.has(code)) { tipoIdx.set(code, tipos.length); tipos.push([code, get(r, 'DS_TIPO_BEM_CANDIDATO')]); }
  let c = byCand.get(sq);
  if (!c) byCand.set(sq, (c = { uf: get(r, 'SG_UF'), items: [] }));
  c.items.push([tipoIdx.get(code), cleanDesc(get(r, 'DS_BEM_CANDIDATO')), money(get(r, 'VR_BEM_CANDIDATO'))]);
}

// Resumo: [total em reais, máscara de grupos, nº de bens]
const summary = {};
const perUf = {};
for (const [sq, { uf, items }] of byCand) {
  items.sort((a, b) => b[2] - a[2]);
  let total = 0, mask = 0;
  for (const [t, , v] of items) {
    total += v;
    mask |= 1 << (groupOf.get(tipos[t][0]) ?? OTHER);
  }
  summary[sq] = [Math.round(total), mask, items.length];
  (perUf[uf] ??= {})[sq] = items;
}

const gen = `${get(rows[0], 'DT_GERACAO')} ${get(rows[0], 'HH_GERACAO')}`;
const outDir = resolve(root, 'public/data');
writeFileSync(resolve(outDir, 'patrimonio.json'), JSON.stringify({ gen, groups: GROUPS.map(([l]) => l), c: summary }));
const bensDir = resolve(outDir, 'bens');
rmSync(bensDir, { recursive: true, force: true });
mkdirSync(bensDir, { recursive: true });
const tipoNames = tipos.map(([, ds]) => ds);
for (const [uf, c] of Object.entries(perUf)) {
  writeFileSync(resolve(bensDir, `${uf}.json`), JSON.stringify({ tipos: tipoNames, c }));
}
console.log(`${rows.length} bens de ${byCand.size} candidatos → public/data/patrimonio.json e public/data/bens/ (${Object.keys(perUf).length} UFs)`);
