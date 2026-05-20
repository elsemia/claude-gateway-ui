import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";

export function CodeBlock({ code, children }: { code: string; children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="relative bg-[var(--code-bg)] rounded-lg p-4 pr-14 font-mono text-sm text-[var(--foreground)] overflow-x-auto">
      <pre className="whitespace-pre-wrap break-all">{children ?? code}</pre>
      <button
        onClick={onCopy}
        className="absolute top-3 right-3 inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--background)] text-[var(--muted)]"
        type="button"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? "OK" : "Copy"}
      </button>
    </div>
  );
}

export function HighlightedShell({ lines }: { lines: { kw: string; val: string }[] }) {
  return (
    <>
      {lines.map((l, i) => (
        <div key={i}>
          <span className="text-[var(--accent-dark)] font-bold">{l.kw}</span>
          <span>=</span>
          <span style={{ color: "#4a6b3a" }}>{l.val}</span>
        </div>
      ))}
    </>
  );
}
