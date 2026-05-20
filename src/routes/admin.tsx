import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useLang, t } from "@/lib/i18n";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type ApiKey = Tables<"api_keys">;
type UsageLog = Tables<"usage_logs">;

function AdminPage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [logs, setLogs] = useState<UsageLog[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/login" });
      } else {
        setReady(true);
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const [k, l] = await Promise.all([
        supabase.from("api_keys").select("*").order("friend_name"),
        supabase.from("usage_logs").select("*").order("request_time", { ascending: false }).limit(50),
      ]);
      if (k.data) setKeys(k.data);
      if (l.data) setLogs(l.data);
    })();
  }, [ready]);

  const toggleActive = async (k: ApiKey) => {
    const newVal = !k.is_active;
    setKeys((prev) => prev.map((x) => (x.id === k.id ? { ...x, is_active: newVal } : x)));
    await supabase.from("api_keys").update({ is_active: newVal }).eq("id", k.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const fmtDate = (s: string) => {
    const d = new Date(s);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen">
      <Header
        right={
          <button
            onClick={signOut}
            className="text-sm border border-[var(--border)] px-3 py-1.5 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)]"
          >
            {t({ pt: "Sair", en: "Sign out" }, lang)}
          </button>
        }
      />
      <main className="max-w-6xl mx-auto px-6 pb-24 space-y-10">
        <section>
          <h2 className="font-serif text-2xl mb-4">{t({ pt: "Chaves de API", en: "API Keys" }, lang)}</h2>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-[var(--faint)] bg-[var(--background)]/40">
                  <tr>
                    <Th>{t({ pt: "Nome", en: "Friend name" }, lang)}</Th>
                    <Th>{t({ pt: "Prefixo", en: "Key prefix" }, lang)}</Th>
                    <Th>{t({ pt: "Ativa", en: "Active" }, lang)}</Th>
                    <Th>{t({ pt: "Hoje", en: "Used today" }, lang)}</Th>
                    <Th>{t({ pt: "Mês", en: "Used month" }, lang)}</Th>
                    <Th>{t({ pt: "Limite/dia", en: "Daily limit" }, lang)}</Th>
                    <Th>{t({ pt: "Limite/mês", en: "Monthly limit" }, lang)}</Th>
                  </tr>
                </thead>
                <tbody>
                  {keys.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-[var(--faint)]">—</td></tr>
                  )}
                  {keys.map((k) => (
                    <tr key={k.id} className="border-t border-[var(--border)]">
                      <Td>{k.friend_name}</Td>
                      <Td className="font-mono text-xs">{k.key_prefix}</Td>
                      <Td>
                        <button
                          onClick={() => toggleActive(k)}
                          className={`relative w-9 h-5 rounded-full transition-colors ${k.is_active ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`}
                          aria-label="toggle"
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${k.is_active ? "translate-x-4" : ""}`} />
                        </button>
                      </Td>
                      <Td>{k.used_today.toLocaleString()}</Td>
                      <Td>{k.used_this_month.toLocaleString()}</Td>
                      <Td>{k.daily_limit_tokens.toLocaleString()}</Td>
                      <Td>{k.monthly_limit_tokens.toLocaleString()}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl mb-4">{t({ pt: "Logs de Uso", en: "Usage Logs" }, lang)}</h2>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-[var(--faint)] bg-[var(--background)]/40">
                  <tr>
                    <Th>{t({ pt: "Hora", en: "Time" }, lang)}</Th>
                    <Th>{t({ pt: "Nome", en: "Friend" }, lang)}</Th>
                    <Th>{t({ pt: "Modelo", en: "Model" }, lang)}</Th>
                    <Th>{t({ pt: "Input", en: "Input" }, lang)}</Th>
                    <Th>{t({ pt: "Output", en: "Output" }, lang)}</Th>
                    <Th>{t({ pt: "Total", en: "Total" }, lang)}</Th>
                    <Th>{t({ pt: "Status", en: "Status" }, lang)}</Th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-[var(--faint)]">—</td></tr>
                  )}
                  {logs.map((l) => (
                    <tr key={l.id} className="border-t border-[var(--border)]">
                      <Td className="font-mono text-xs">{fmtDate(l.request_time)}</Td>
                      <Td>{l.friend_name ?? "—"}</Td>
                      <Td className="font-mono text-xs">{l.model ?? "—"}</Td>
                      <Td>{l.input_tokens.toLocaleString()}</Td>
                      <Td>{l.output_tokens.toLocaleString()}</Td>
                      <Td>{l.total_tokens.toLocaleString()}</Td>
                      <Td>{l.status ?? "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
