// Converte o CSV de candidatos do TSE (consulta_cand_AAAA_BRASIL.csv) no JSON compacto
// usado pelo app. Uso:
//   npm run prepare-data -- caminho/para/consulta_cand_2026_BRASIL.csv
// Saída: public/data/candidatos.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixDashes, readTseCsv } from './lib/tse-csv.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const input = process.argv[2];
if (!input) {
  console.error('Informe o caminho do CSV: npm run prepare-data -- consulta_cand_2026_BRASIL.csv');
  process.exit(1);
}
const ELECTION_DATE = new Date(2026, 9, 4); // 4 de outubro de 2026

const { rows: body, get } = readTseCsv(readFileSync(input));

// --- normalização de texto
const EMPTY = new Set(['#NULO', '#NE', '']);
const LOWER = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'di', 'du', 'del', 'la', 'van', 'von']);
const capFirstLetter = (p) => p.replace(/^([^\p{L}]*)(\p{L})/u, (_, a, b) => a + b.toUpperCase());
function titleCase(s) {
  if (EMPTY.has(s)) return '';
  return fixDashes(s).toLowerCase().split(/\s+/).filter(Boolean).map((w, i) => {
    if (i > 0 && LOWER.has(w)) return w;
    if (['ii', 'iii', 'iv'].includes(w)) return w.toUpperCase();
    return w.split('-').map(capFirstLetter).join('-');
  }).join(' ');
}
const sentenceCase = (s) => (EMPTY.has(s) ? '' : s[0] + s.slice(1).toLowerCase());
const nullable = (s) => (EMPTY.has(s) ? '' : s);
const FEDERATIONS = {
  'FEDERAÇÃO BRASIL DA ESPERANÇA - FE BRASIL': 'Brasil da Esperança (PT/PCdoB/PV)',
  'FEDERAÇÃO PSDB CIDADANIA': 'PSDB Cidadania',
  'FEDERAÇÃO PSOL REDE': 'PSOL Rede',
  'FEDERAÇÃO RENOVAÇÃO SOLIDÁRIA': 'Renovação Solidária',
  'FEDERAÇÃO UNIÃO PROGRESSISTA': 'União Progressista',
};
const federation = (s) => FEDERATIONS[s] ?? (EMPTY.has(s) ? '' : titleCase(s.replace(/^FEDERAÇÃO\s+/, '')));

function ageAt(dmy) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dmy);
  if (!m) return -1;
  const [, d, mo, y] = m.map(Number);
  let age = ELECTION_DATE.getFullYear() - y;
  if (mo - 1 > ELECTION_DATE.getMonth() || (mo - 1 === ELECTION_DATE.getMonth() && d > ELECTION_DATE.getDate())) age--;
  return age;
}

// --- colunas categóricas (codificadas por índice num dicionário)
const FACETS = {
  uf: (r) => get(r, 'SG_UF'),
  cargo: (r) => sentenceCase(get(r, 'DS_CARGO')),
  partido: (r) => get(r, 'SG_PARTIDO'),
  agrem: (r) => sentenceCase(get(r, 'TP_AGREMIACAO')),
  fed: (r) => federation(get(r, 'NM_FEDERACAO')),
  genero: (r) => sentenceCase(get(r, 'DS_GENERO')),
  instr: (r) => sentenceCase(get(r, 'DS_GRAU_INSTRUCAO')),
  civil: (r) => sentenceCase(get(r, 'DS_ESTADO_CIVIL')),
  raca: (r) => sentenceCase(get(r, 'DS_COR_RACA')),
  ocup: (r) => sentenceCase(get(r, 'DS_OCUPACAO')),
  ufnasc: (r) => nullable(get(r, 'SG_UF_NASCIMENTO')),
};
const keys = Object.keys(FACETS);
const raw = body.map((r) => keys.map((k) => FACETS[k](r)));
const dicts = {};
const index = {};
keys.forEach((k, j) => {
  dicts[k] = [...new Set(raw.map((v) => v[j]))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  index[k] = new Map(dicts[k].map((v, i) => [v, i]));
});

const party = {};
const rows = body.map((r, n) => {
  party[get(r, 'SG_PARTIDO')] = titleCase(get(r, 'NM_PARTIDO'));
  const social = get(r, 'NM_SOCIAL_CANDIDATO');
  const agrem = get(r, 'TP_AGREMIACAO');
  return [
    Number(get(r, 'NR_CANDIDATO')),
    titleCase(get(r, 'NM_URNA_CANDIDATO')),
    titleCase(get(r, 'NM_CANDIDATO')),
    EMPTY.has(social) || social === 'NÃO DIVULGÁVEL' ? '' : titleCase(social),
    ageAt(get(r, 'DT_NASCIMENTO')),
    get(r, 'DT_NASCIMENTO'),
    ...keys.map((k, j) => index[k].get(raw[n][j])),
    agrem === 'COLIGAÇÃO' ? titleCase(get(r, 'NM_COLIGACAO')) : '',
    agrem !== 'PARTIDO ISOLADO' ? get(r, 'DS_COMPOSICAO_COLIGACAO') : '',
    get(r, 'SG_UF') === 'BR' ? 'Brasil' : titleCase(get(r, 'NM_UE')),
    get(r, 'SQ_CANDIDATO'), // identificador usado no nome dos arquivos de foto
  ];
});

const first = body[0];
const out = {
  keys,
  dicts,
  party,
  rows,
  gen: `${get(first, 'DT_GERACAO')} ${get(first, 'HH_GERACAO')}`,
};
const dest = resolve(root, 'public/data/candidatos.json');
mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, JSON.stringify(out));
console.log(`${rows.length} candidaturas → ${dest}`);
