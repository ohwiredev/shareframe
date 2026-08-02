type PanelHeaderProps = {
  title: string;
  subtitle: string;
};

/** Standard side-panel header: h1 + sub (DESIGN.md §2.2 / §4.1). */
export function PanelHeader({ title, subtitle }: PanelHeaderProps) {
  return (
    <header className="panel-header">
      <h1>{title}</h1>
      <p className="sub">{subtitle}</p>
    </header>
  );
}
