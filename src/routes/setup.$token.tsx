import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Copy, Check, Hexagon } from "lucide-react";
import { Header } from "@/components/Header";
import { CodeBlock, HighlightedShell } from "@/components/CodeBlock";
import { useLang, t } from "@/lib/i18n";

export const Route = createFileRoute("/setup/$token")({
  component: SetupPage,
});

const BASE_URL = "https://zwbtvtbuuclufbnafdfs.supabase.co/functions/v1/anthropic-gateway";

function SetupPage() {
  const { token } = Route.useParams();
  const { lang } = useLang();
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"unix" | "ps" | "cmd">("unix");

  const hasToken = token && token.length > 0 && token !== "_";

  const copyKey = async () => {
    if (!hasToken) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const unixLines = [
    { kw: "export ANTHROPIC_BASE_URL", val: `"${BASE_URL}"` },
    { kw: "export ANTHROPIC_AUTH_TOKEN", val: `"${token}"` },
    { kw: "export ANTHROPIC_API_KEY", val: `"dummy"` },
    { kw: "export ANTHROPIC_MODEL", val: `"claude-sonnet-4-5"` },
  ];
  const psLines = [
    { kw: '$env:ANTHROPIC_BASE_URL', val: `"${BASE_URL}"` },
    { kw: '$env:ANTHROPIC_AUTH_TOKEN', val: `"${token}"` },
    { kw: '$env:ANTHROPIC_API_KEY', val: `"dummy"` },
    { kw: '$env:ANTHROPIC_MODEL', val: `"claude-sonnet-4-5"` },
  ];
  const cmdLines = [
    { kw: "setx ANTHROPIC_BASE_URL", val: `"${BASE_URL}"` },
    { kw: "setx ANTHROPIC_AUTH_TOKEN", val: `"${token}"` },
    { kw: "setx ANTHROPIC_API_KEY", val: `"dummy"` },
    { kw: "setx ANTHROPIC_MODEL", val: `"claude-sonnet-4-5"` },
  ];
  const toCode = (ls: { kw: string; val: string }[]) => ls.map((l) => `${l.kw}=${l.val}`).join("\n");

  const downloadSh = () => {
    const sh = `#!/usr/bin/env bash
set -e
echo "Installing Claude Code…"
npm install -g @anthropic-ai/claude-code

RC="$HOME/.bashrc"
[ -n "$ZSH_VERSION" ] && RC="$HOME/.zshrc"
[ -f "$HOME/.zshrc" ] && RC="$HOME/.zshrc"

{
  echo ""
  echo "# Claude Code Gateway"
  echo 'export ANTHROPIC_BASE_URL="${BASE_URL}"'
  echo 'export ANTHROPIC_AUTH_TOKEN="${token}"'
  echo 'export ANTHROPIC_API_KEY="dummy"'
  echo 'export ANTHROPIC_MODEL="claude-sonnet-4-5"'
} >> "$RC"

echo "Done. Restart your terminal or run: source $RC"
`;
    download("setup.sh", sh, "text/x-shellscript");
  };

  const downloadBat = () => {
    const bat = `@echo off
echo Installing Claude Code...
call npm install -g @anthropic-ai/claude-code
setx ANTHROPIC_BASE_URL "${BASE_URL}"
setx ANTHROPIC_AUTH_TOKEN "${token}"
setx ANTHROPIC_API_KEY "dummy"
setx ANTHROPIC_MODEL "claude-sonnet-4-5"
echo Done. Open a new terminal and run: claude
pause
`;
    download("setup.bat", bat, "text/plain");
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-3xl mx-auto px-6 pb-24">
        <div className="text-center mt-6">
          <h1 className="font-serif text-4xl">Claude Code Gateway</h1>
          <p className="mt-3 text-[var(--muted)]">
            {t({
              pt: "Sua chave de acesso está pronta. Siga os passos abaixo.",
              en: "Your access key is ready. Follow the steps below.",
            }, lang)}
          </p>
        </div>

        <div className="mt-6 rounded-lg border bg-[var(--warn-bg)] border-[var(--warn-border)] text-[var(--warn-text)] px-4 py-3 text-sm">
          {t({
            pt: "Mantenha este link privado — sua chave de API está na URL.",
            en: "Keep this link private — your API key is in the URL.",
          }, lang)}
        </div>

        {/* API Key card */}
        <div className="mt-5 rounded-xl border-2 border-[var(--accent)] bg-[var(--card)] p-5">
          <p className="text-xs uppercase tracking-wider font-semibold text-[var(--accent-dark)]">
            {t({ pt: "Sua chave de API", en: "Your API key" }, lang)}
          </p>
          {hasToken ? (
            <div className="mt-3 flex items-center gap-2">
              <code className="flex-1 bg-[var(--code-bg)] rounded-md px-3 py-2 font-mono text-sm break-all">
                {reveal ? token : "•".repeat(Math.min(40, Math.max(20, token.length)))}
              </code>
              <button
                onClick={() => setReveal((r) => !r)}
                className="p-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"
                aria-label="reveal"
              >
                {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                onClick={copyKey}
                className="p-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"
                aria-label="copy"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--muted)]">
              {t({
                pt: "Nenhuma chave na URL — abra esta página via link /setup/sk-…",
                en: "No key in URL — open this page via a /setup/sk-… link",
              }, lang)}
            </p>
          )}
        </div>

        {/* Prerequisite */}
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-start gap-3">
            <Hexagon size={28} className="text-[var(--accent)] shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-serif text-lg">
                {t({ pt: "Antes de começar — Instale o Node.js", en: "Before you start — Install Node.js" }, lang)}
              </h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {t({ pt: "O Claude Code requer Node.js 18 ou superior.", en: "Claude Code requires Node.js 18 or higher." }, lang)}
              </p>
              <p className="mt-1 text-xs text-[var(--faint)]">
                {t({ pt: "Já tem o Node.js? Pule esta etapa.", en: "Already have Node.js? Skip this step." }, lang)}
              </p>
              <a
                href="https://nodejs.org"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                {t({ pt: "Baixar Node.js", en: "Download Node.js" }, lang)} ↗
              </a>
            </div>
          </div>
        </div>

        {/* Step 1 */}
        <Step n={1} title={t({ pt: "Instalar o Claude Code:", en: "Install Claude Code:" }, lang)}>
          <p className="text-sm text-[var(--muted)] mb-3">
            {t({ pt: "Instale o pacote globalmente via npm.", en: "Install the package globally via npm." }, lang)}
          </p>
          <CodeBlock code="npm install -g @anthropic-ai/claude-code">
            <span className="text-[var(--faint)]">$ </span>npm install -g @anthropic-ai/claude-code
          </CodeBlock>
        </Step>

        {/* Step 2 */}
        <Step n={2} title={t({ pt: "Configurar seu terminal:", en: "Configure your terminal:" }, lang)}>
          <div className="flex gap-1 border-b border-[var(--border)] mb-3">
            {[
              { id: "unix" as const, label: "macOS / Linux" },
              { id: "ps" as const, label: "Windows PowerShell" },
              { id: "cmd" as const, label: "Windows CMD" },
            ].map((tb) => (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className={`px-3 py-2 text-sm border-b-2 -mb-px ${
                  tab === tb.id
                    ? "border-[var(--accent)] text-[var(--foreground)] font-medium"
                    : "border-transparent text-[var(--faint)] hover:text-[var(--muted)]"
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>
          {tab === "unix" && <CodeBlock code={toCode(unixLines)}><HighlightedShell lines={unixLines} /></CodeBlock>}
          {tab === "ps" && <CodeBlock code={toCode(psLines)}><HighlightedShell lines={psLines} /></CodeBlock>}
          {tab === "cmd" && <CodeBlock code={toCode(cmdLines)}><HighlightedShell lines={cmdLines} /></CodeBlock>}
        </Step>

        {/* Step 3 */}
        <Step n={3} title={t({ pt: "Comece a usar:", en: "Start using:" }, lang)}>
          <CodeBlock code="claude">
            <span className="text-[var(--faint)]">$ </span>claude
          </CodeBlock>
        </Step>

        <hr className="my-10 border-[var(--border)]" />

        {/* Download */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="font-serif text-xl">
            {t({ pt: "Configuração com um clique", en: "One-click setup" }, lang)}
          </h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {t({
              pt: "Baixe um script que instala o Claude Code e configura as variáveis de ambiente para você.",
              en: "Download a script that installs Claude Code and configures the environment variables for you.",
            }, lang)}
          </p>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <button
              onClick={downloadSh}
              disabled={!hasToken}
              className="bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white px-4 py-2.5 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {t({ pt: "Baixar para macOS / Linux", en: "Download for macOS / Linux" }, lang)}
            </button>
            <button
              onClick={downloadBat}
              disabled={!hasToken}
              className="bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white px-4 py-2.5 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {t({ pt: "Baixar para Windows", en: "Download for Windows" }, lang)}
            </button>
          </div>
        </div>

        <footer className="mt-10 text-center text-xs text-[var(--faint)] space-y-1">
          <p>{t({ pt: "Gateway privado · não compartilhe este link", en: "Private gateway · do not share this link" }, lang)}</p>
          <p>{t({ pt: "Precisa de ajuda? Entre em contato com o administrador", en: "Need help? Contact your administrator" }, lang)}</p>
        </footer>
      </main>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-7 h-7 rounded-full bg-[var(--accent)] text-white inline-flex items-center justify-center text-sm font-semibold">{n}</span>
        <h3 className="font-serif text-lg">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function download(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
