// Número do candidato em "casas" como no visor da urna
export default function Digits({ n }) {
  return (
    <span className="digits" aria-label={`Número ${n}`}>
      {String(n).split('').map((c, i) => <i key={i}>{c}</i>)}
    </span>
  );
}
