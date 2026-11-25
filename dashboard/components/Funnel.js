// Funil horizontal: uma série só, barras proporcionais ao total de visitantes.
export default function Funnel({ f, showSales }) {
  const steps = [
    { label: 'Chegaram na página', v: f.visitors },
    { label: 'Rolaram 25%', v: f.s25 },
    { label: 'Rolaram 50%', v: f.s50 },
    { label: 'Rolaram 75%', v: f.s75 },
    { label: 'Chegaram ao fim', v: f.s100 },
    { label: 'Clicaram no botão', v: f.cta },
  ];
  if (showSales && f.sales != null) steps.push({ label: 'Compraram', v: f.sales });
  const max = Math.max(1, f.visitors);
  return (
    <div className="bars" role="table" aria-label="Funil da página">
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].v : null;
        const lost = prev ? prev - s.v : 0;
        const tip = `${s.label}: ${s.v} pessoas (${Math.round((s.v / max) * 100)}% de quem chegou)${prev ? ` · perdeu ${lost} da etapa anterior` : ''}`;
        return (
          <div className="barrow" role="row" key={s.label} title={tip}>
            <span role="cell">{s.label}</span>
            <div className="track" role="cell"><div className="fill" style={{ width: `${(s.v / max) * 100}%` }} /></div>
            <span className="val" role="cell">
              {s.v} <span className="muted small">· {Math.round((s.v / max) * 100)}%</span>
              {prev && lost > 0 ? <div className="lost">−{Math.round((lost / prev) * 100)}%</div> : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}
