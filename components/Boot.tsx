export function Boot({ line, progress }: { line?: string; progress?: number }) {
  const value = typeof progress === "number" ? Math.max(0, Math.min(100, progress)) : null;
  return (
    <div className="boot" role="status">
      <div className="boot-glow" aria-hidden="true" />
      <p className="boot-mark display">Shahrokh</p>
      {line ? <p>{line}</p> : null}
      {value !== null ? (
        <>
          <div className="boot-bar" aria-hidden="true">
            <span style={{ width: `${value}%` }} />
          </div>
          <p className="boot-pct">{Math.round(value)}%</p>
        </>
      ) : null}
    </div>
  );
}
