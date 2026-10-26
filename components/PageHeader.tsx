export function PageHeader({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: string; children?: React.ReactNode }) {
  return (
    <header className="header">
      <div>
        <div className="eyebrow">RAMFORGE / {eyebrow}</div>
        <h1>{title}</h1>
        {intro && <p>{intro}</p>}
      </div>
      {children && <div className="smallrow">{children}</div>}
    </header>
  );
}
