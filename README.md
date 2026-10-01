# Candidatos 2026

Explorador das candidaturas das eleições gerais de 2026 a partir dos dados abertos do TSE.
Busca por nome ou número, filtros cruzados com contagens, panorama em barras clicáveis,
ficha do candidato e filtros salvos na URL (dá para compartilhar um recorte por link).

É um app estático (React + Vite): não precisa de servidor nem banco de dados.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:5173.

## Atualizando os dados

O repositório já vem com `public/data/candidatos.json` gerado a partir do
`consulta_cand_2026_BRASIL.csv` de 01/10/2026. Para atualizar, baixe o CSV mais recente no
[Portal de Dados Abertos do TSE](https://dadosabertos.tse.jus.br/) (conjunto "Candidatos - 2026")
e rode:

```bash
npm run prepare-data -- caminho/para/consulta_cand_2026_BRASIL.csv
```

O script lê o CSV (Latin-1, separado por `;`), normaliza os textos, calcula a idade na data
da eleição e grava um JSON compacto. CPF, título de eleitor e e-mail não são incluídos.

## Espectro ideológico dos partidos

O filtro **Espectro do partido** classifica cada candidatura pela posição do seu partido na escala
esquerda-direita (0 a 10), usando as médias da onda de 2022 do survey com cientistas políticos de
Bolognesi, Ribeiro, Codato e Silva, ["O desaparecimento do centro ideológico no sistema partidário
brasileiro"](https://doi.org/10.1590/1807-0191202531120), *Opinião Pública*, 2025. As faixas
(extrema esquerda, esquerda, centro-esquerda, centro, centro-direita, direita, extrema direita) são
as definidas no artigo. É a posição do partido, não do candidato.

As notas ficam em `src/lib/ideology.js`. Partidos que mudaram depois de 2022 seguem a regra do
artigo: troca de nome mantém a nota (PMN → Mobiliza, PMB → Democrata), fusão usa a média
(PTB + Patriota → PRD) e incorporação mantém a nota de quem incorporou (Podemos/PSC,
Solidariedade/PROS). Partidos criados depois do survey sem nota aparecem como "Sem classificação".

Há também ajustes editoriais do projeto, em `BAND_OVERRIDE`, que prevalecem sobre a faixa do survey e
são sinalizados na ficha do candidato: PSOL como esquerda (a nota 1,41 o colocaria em extrema
esquerda) e Missão, que não está no survey, como extrema direita.

## Fotos dos candidatos

O TSE publica as fotos num zip por estado. O script baixa, extrai e renomeia cada foto
para `public/fotos/<SQ_CANDIDATO>.jpg`, além de gerar `public/fotos/index.json`
com a lista de quem tem foto:

```bash
npm run fotos -- PR          # só o Paraná
npm run fotos -- PR BR       # Paraná + presidente/vice
npm run fotos -- all         # todos os estados
npm run fotos -- --zip ~/Downloads/foto_cand2026_PR_div.zip   # zip já baixado
```

Os zips ficam em `.cache/` e são reaproveitados (use `--force` para baixar de novo).
Rodar de novo para outro estado só acrescenta fotos, não apaga as existentes.

Sem `index.json` o app funciona normalmente e mostra as iniciais no lugar da foto.
Com fotos carregadas aparecem o modo **Fotos** (galeria) e o filtro **Só com foto**.

**Hospedando todas as fotos:** o Brasil inteiro são ~21 mil arquivos (~120 MB). `public/fotos/` não é
versionada: no deploy da Vercel as fotos são baixadas do TSE durante o build (ver "Publicando").
Se preferir não colocar isso junto do site, suba o conteúdo de `public/fotos/` (incluindo o
`index.json`) para um bucket/CDN (S3, Cloudflare R2 etc.) e faça o build com
`VITE_PHOTO_BASE_URL=https://seu-cdn/fotos/ npm run build`.

As fotos são dados abertos do TSE (licença CC-BY), então mantenha a atribuição da fonte.

## Publicando

```bash
npm run build
```

Gera a pasta `dist/`, que pode ir para qualquer hospedagem estática:

- **Vercel** (com todas as fotos): importe o repositório pelo Git. O `vercel.json` já usa
  `npm run build:vercel`, que baixa as fotos de todos os estados do TSE e depois faz o build.
  Se o download falhar, o build segue sem fotos (o app mostra as iniciais). Use deploy via Git,
  não `vercel deploy` da pasta local: a CLI limita o upload a 15 mil arquivos / 100 MB no plano Hobby.
- **Netlify / Cloudflare Pages**: importe o repositório. Comando de build `npm run build`, pasta de saída `dist`
  (sem fotos; use `npm run build:vercel` como comando para incluí-las. No Cloudflare Pages o limite
  de ~20 mil arquivos por deploy pode estourar).
- **GitHub Pages** (em subcaminho): `BASE_PATH=/nome-do-repo/ npm run build` e publique `dist/`.

## Estrutura

```
scripts/prepare-data.mjs     CSV do TSE → public/data/candidatos.json
scripts/fetch-photos.mjs     zips de fotos do TSE → public/fotos/
src/App.jsx                  estado dos filtros e composição da página
src/lib/constants.js         categorias, ordens, rótulos e posições das colunas
src/lib/data.js              carregamento do JSON e índice de busca
src/lib/useFilteredData.js   filtragem, contagens cruzadas e ordenação
src/lib/urlState.js          leitura/escrita dos filtros no hash da URL
src/components/              Header, Filters, Facet, ActiveTags, Overview, Bars, ResultList, Photo, CandidateDrawer
src/styles.css               tokens de cor (claro/escuro) e layout
```

### Formato do JSON

Para manter o arquivo pequeno, cada candidatura é um array e as categorias são índices
em dicionários (`dicts`). As posições estão em `src/lib/constants.js` (`COL` e `FACET_START`).
Se adicionar uma coluna nova, atualize os dois lados: o script e as constantes.

### Contagens cruzadas

A contagem ao lado de cada opção considera todos os filtros ativos **exceto o da própria
categoria**. É o que diz quantos resultados haveria ao marcar aquela opção. Tudo é calculado
numa única passada sobre os ~21 mil registros (ver `useFilteredData.js`).
