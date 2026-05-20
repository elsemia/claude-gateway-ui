import { Link } from "@tanstack/react-router";
import { useLang, type Lang } from "@/lib/i18n";
import type { ReactNode } from "react";

function Asterisk() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <g stroke="#d4846a" strokeWidth="1.8" strokeLinecap="round">
        <line x1="12" y1="2" x2="12" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="4.9" y1="4.9" x2="19.1" y2="19.1" />
        <line x1="4.9" y1="19.1" x2="19.1" y2="4.9" />
      </g>
    </svg>
  );
}

export function LangToggle() {
  const { lang, setLang } = useLang();
  const btn = (l: Lang, label: string) => (
    <button
      onClick={() => setLang(l)}
      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
        lang === l ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:text-[var(--foreground)]"
      }`}
    >
      {label}
    </button>
  );
  return (
    <div className="inline-flex items-center gap-1 border border-[var(--border)] rounded-full p-0.5 bg-[var(--card)]">
      {btn("pt", "PT")}
      <span className="text-[var(--faint)] text-xs">|</span>
      {btn("en", "EN")}
    </div>
  );
}

export function Header({ right, titleLink = "/" }: { right?: ReactNode; titleLink?: string }) {
  return (
    <header className="w-full px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
      <Link to={titleLink} className="flex items-center gap-2">
        <Asterisk />
      </Link>
      <div className="flex items-center gap-3">
        {right}
        <LangToggle />
      </div>
    </header>
  );
}

export { Asterisk };
