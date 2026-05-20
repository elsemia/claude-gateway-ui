import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, Terminal } from "lucide-react";
import { Header } from "@/components/Header";
import { CodeBlock, HighlightedShell } from "@/components/CodeBlock";
import { useLang, t } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const BASE_URL = "https://zwbtvtbuuclufbnafdfs.supabase.co/functions/v1/anthropic-gateway";

const unixLines = [
  { kw: "export ANTHROPIC_BASE_URL", val: `"${BASE_URL}"` },
  { kw: "export ANTHROPIC_AUTH_TOKEN", val: `"sk-your-key"` },
  { kw: "export ANTHROPIC_API_KEY", val: `"dummy"` },
  { kw: "export ANTHROPIC_MODEL", val: `"claude-sonnet-4-5"` },
];
const unixCode = unixLines.map((l) => `${l.kw}=${l.val}`).join("\n");

const psLines = [
  { kw: '$env:ANTHROPIC_BASE_URL', val: `"${BASE_URL}"` },
  { kw: '$env:ANTHROPIC_AUTH_TOKEN', val: `"sk-your-key"` },
  { kw: '$env:ANTHROPIC_API_KEY', val: `"dummy"` },
  { kw: '$env:ANTHROPIC_MODEL', val: `"claude-sonnet-4-5"` },
];
const psCode = psLines.map((l) => `${l.kw}=${l.val}`).join("\n");

function HomePage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"unix" | "ps">("unix");
  const [userKey, setUserKey] = useState("");
  const [keyError, setKeyError] = useState<string | null>(null);

  const goToSetup = () => {
    const k = userKey.trim();
    if (!k) {
      setKeyError(t({ pt: "Cole sua chave primeiro", en: "Paste your key first" }, lang));
      return;
    }
    navigate({ to: "/setup/$token", params: { token: k } });
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-5xl mx-auto px-6 pb-24">
        <section className="pt-12 pb-12 text-center">
          <span className="inline-block text-xs uppercase tracking-wider border border-[var(--border)] rounded-full px-3 py-1 text-[var(--muted)]">
            {t({ pt: "Gateway de API Privado", en: "Private API Gateway" }, lang)}
          </span>
          <h1 className="mt-6 font-serif text-5xl md:text-6xl leading-tight">
            {t({ pt: "Claude Code, ", en: "Claude Code, " }, lang)}
            <span className="text-[var(--accent)]">
              {t({ pt: "suas regras.", en: "your rules." }, lang)}
            </span>
          </h1>
          <p className="mt-5 text-[var(--muted)] max-w-2xl mx-auto">
            {t({
              pt: "Um proxy privado compatível com Anthropic. Chaves por usuário, cotas de tokens e streaming completo — tudo gerenciado por você.",
              en: "A private Anthropic-compatible proxy. Per-user keys, token quotas and full streaming — all managed by you.",
            }, lang)}
          </p>
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          {[
            { t: { pt: "Chaves por usuário", en: "Per-user keys" }, d: { pt: "Distribua chaves únicas para cada pessoa e revogue a qualquer momento.", en: "Issue unique keys per person and revoke at any time." } },
            { t: { pt: "Cotas de tokens", en: "Token quotas" }, d: { pt: "Limites diários e mensais por chave para controle de custos.", en: "Daily and monthly limits per key for cost control." } },
            { t: { pt: "Streaming completo", en: "Full streaming" }, d: { pt: "Suporte total a respostas em streaming, sem buffer.", en: "Complete streaming response support, no buffering." } },
          ].map((c, i) => (
            <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
              <h3 className="text-[var(--accent)] font-serif text-lg">{t(c.t, lang)}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{t(c.d, lang)}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 grid md:grid-cols-2 gap-4">
          {/* Admin card */}
          <div className="bg-[var(--card)] border-2 border-[var(--accent)] rounded-xl p-6 flex flex-col">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center">
                <KeyRound size={20} />
              </div>
              <h3 className="font-serif text-xl">{t({ pt: "Sou admin", en: "I'm an admin" }, lang)}</h3>
            </div>
            <p className="mt-3 text-sm text-[var(--muted)] flex-1">
              {t({
                pt: "Acesse o painel para gerenciar chaves e monitorar uso.",
                en: "Access the panel to manage keys and monitor usage.",
              }, lang)}
            </p>
            <Link
              to="/login"
              className="mt-5 inline-flex items-center justify-center gap-1 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
            >
              {t({ pt: "Entrar no painel", en: "Enter panel" }, lang)} →
            </Link>
          </div>

          {/* User card */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 flex flex-col">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center">
                <Terminal size={20} />
              </div>
              <h3 className="font-serif text-xl">{t({ pt: "Tenho uma chave", en: "I have a key" }, lang)}</h3>
            </div>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {t({
                pt: "Cole sua chave de acesso para ver as instruções de configuração.",
                en: "Paste your access key to see setup instructions.",
              }, lang)}
            </p>
            <input
              value={userKey}
              onChange={(e) => { setUserKey(e.target.value); setKeyError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") goToSetup(); }}
              placeholder="sk-..."
              className="mt-4 w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--accent)]"
            />
            {keyError && (
              <div className="mt-2 text-xs px-3 py-2 rounded-md border bg-[var(--warn-bg)] border-[var(--warn-border)] text-[var(--warn-text)]">
                {keyError}
              </div>
            )}
            <button
              onClick={goToSetup}
              className="mt-3 inline-flex items-center justify-center gap-1 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
            >
              {t({ pt: "Ver instruções", en: "See instructions" }, lang)} →
            </button>
          </div>
        </section>

        <section className="mt-16">
          <p className="text-xs uppercase tracking-wider text-[var(--accent)] font-semibold">
            {t({ pt: "Início Rápido", en: "Quick Start" }, lang)}
          </p>
          <h2 className="mt-2 font-serif text-2xl">
            {t({ pt: "Configure seu terminal", en: "Configure your terminal" }, lang)}
          </h2>

          <div className="mt-5 flex gap-1 border-b border-[var(--border)]">
            {[
              { id: "unix" as const, label: "Linux / macOS" },
              { id: "ps" as const, label: "Windows (PowerShell)" },
            ].map((tb) => (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className={`px-4 py-2 text-sm border-b-2 -mb-px ${
                  tab === tb.id
                    ? "border-[var(--accent)] text-[var(--foreground)] font-medium"
                    : "border-transparent text-[var(--faint)] hover:text-[var(--muted)]"
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {tab === "unix" ? (
              <CodeBlock code={unixCode}><HighlightedShell lines={unixLines} /></CodeBlock>
            ) : (
              <CodeBlock code={psCode}><HighlightedShell lines={psLines} /></CodeBlock>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
