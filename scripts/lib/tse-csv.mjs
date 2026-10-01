// Leitura dos CSVs do TSE: separador ";", campos entre aspas, arquivo em Latin-1 (Windows-1252)
export function parseCsv(src) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"') { if (src[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ';') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// Devolve as linhas completas e um acessor por nome de coluna
export function readTseCsv(buf) {
  const [header, ...body] = parseCsv(new TextDecoder('latin1').decode(buf));
  const col = Object.fromEntries(header.map((h, i) => [h, i]));
  const get = (r, name) => r[col[name]] ?? '';
  return { rows: body.filter((r) => r.length >= header.length), get };
}

// O TSE grava "¿" no lugar de caracteres fora do Latin-1, quase sempre travessões
export const fixDashes = (s) => s.replace(/¿/g, '–');
