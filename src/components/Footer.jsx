import { useData } from '../lib/data.js';
import { IDEOLOGY_SOURCE, NO_BAND, PARTY_SCORE, partiesByBand } from '../lib/ideology.js';

const TSE = 'https://dadosabertos.tse.jus.br/';
const fmtScore = (s) => s.toFixed(2).replace('.', ',');
const fmtCut = (s) => String(s).replace('.', ',');

// Rodapé com as fontes dos dados e os critérios da classificação ideológica
export default function Footer() {
  const data = useData();
  const bands = partiesByBand();
  const unscored = data.dicts.partido.filter((sg) => PARTY_SCORE[sg] === undefined);
  const name = (sg) => data.party[sg] || sg;

  return (
    <footer className="site-footer" id="metodologia">
      <section>
        <h2>De onde vêm os dados</h2>
        <ul>
          <li>
            <b>Candidaturas</b>: consulta de candidatos 2026 do{' '}
            <a href={TSE} target="_blank" rel="noreferrer">Portal de Dados Abertos do TSE</a>
            {data.gen && <>, arquivo de {data.gen}</>}. As informações pessoais são as declaradas no
            registro da candidatura.
            A idade é calculada na data da eleição. CPF, título de eleitor e e-mail não são publicados aqui.
          </li>
          <li>
            <b>Patrimônio</b>: conjunto "Bens de candidatos" do TSE{data.wealthGen && <>, arquivo de {data.wealthGen}</>}.
            São os valores declarados pelo próprio candidato, em geral pelo custo de aquisição (regra do
            Imposto de Renda), e não o valor de mercado. Quem não declarou bens não necessariamente não tem
            bens. Erros de digitação aparecem como estão no TSE.
          </li>
          <li>
            <b>Redes sociais</b>: links declarados ao TSE, padronizados. Ficam de fora os que não dá para
            reconstruir com segurança.
          </li>
          <li>
            <b>Fotos</b>: divulgadas pelo TSE (licença CC-BY).
          </li>
        </ul>
      </section>

      <section>
        <h2>Como classificamos esquerda e direita</h2>
        <p>
          A classificação é do <b>partido</b>, não do candidato. Candidatos do mesmo partido podem ter
          posições diferentes, e o rótulo não diz nada sobre a pessoa.
        </p>
        <p>
          Usamos a nota média de cada partido, numa escala de 0 (esquerda) a 10 (direita), dada por
          cientistas políticos no survey da Associação Brasileira de Ciência Política (onda de 2022), publicado
          em <a href={IDEOLOGY_SOURCE.url} target="_blank" rel="noreferrer">Bolognesi, Ribeiro, Codato e Silva,
          "O desaparecimento do centro ideológico no sistema partidário brasileiro", <i>Opinião Pública</i>, 2025</a>.
          O artigo divide a escala em sete faixas. Para simplificar, agrupamos as faixas vizinhas em quatro,
          com corte no meio da escala (5). Nenhum partido tem nota entre 4,5 e 5,5, que seria o "centro" do artigo.
          Não fazemos nenhum ajuste manual: a faixa sai apenas da nota.
        </p>
        <table className="bands">
          <thead><tr><th>Faixa</th><th>Nota</th><th>Partidos (nota)</th></tr></thead>
          <tbody>
            {bands.map((b) => (
              <tr key={b.label}>
                <td>{b.label}</td>
                <td className="num">{b.min ? `acima de ${fmtCut(b.min)} até ${fmtCut(b.max)}` : `até ${fmtCut(b.max)}`}</td>
                <td>
                  {b.parties.map((sg, i) => (
                    <span key={sg} title={name(sg)}>{i > 0 && ', '}{sg} ({fmtScore(PARTY_SCORE[sg])})</span>
                  ))}
                </td>
              </tr>
            ))}
            {unscored.length > 0 && (
              <tr>
                <td>{NO_BAND}</td>
                <td className="num">—</td>
                <td>{unscored.join(', ')} (criado depois do survey)</td>
              </tr>
            )}
          </tbody>
        </table>
        <p>
          Partidos que mudaram depois de 2022 seguem a regra do próprio artigo: troca de nome mantém a nota
          (PMN → Mobiliza, PMB → Democrata), fusão usa a média das siglas (PTB + Patriota → PRD) e
          incorporação mantém a nota de quem incorporou (Podemos incorporou o PSC; Solidariedade, o PROS).
        </p>
      </section>

      <p className="fine">
        Projeto independente, sem vínculo com o TSE, partidos ou candidaturas. Não apoia nenhum candidato.
        Os dados são exibidos como o TSE os publica: correções dependem do registro oficial. O site
        registra estatísticas de visita.
      </p>
    </footer>
  );
}
