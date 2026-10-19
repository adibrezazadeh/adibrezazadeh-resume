export function Boot({ line }: { line?: string }) {
  return (
    <div className="boot" role="status">
      <div className="boot-glow" aria-hidden="true" />
      <p className="boot-mark display">Shahrokh</p>
      {line ? <p>{line}</p> : null}
    </div>
  );
}
