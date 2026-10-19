"use client";

export default function OfficeError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="not-found">
      <div>
        <h1 className="display">Shahrokh</h1>
        <p>The office hit a snag. / دفتر به یک گیر خورد. / تعثر المكتب.</p>
        <button className="btn" type="button" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
