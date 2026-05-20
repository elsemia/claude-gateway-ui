import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Copy, Check, AlertTriangle } from "lucide-react";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useLang, t, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type ApiKey = {
  id: string;
  friend_name: string;
  key_prefix: string;
  is_active: boolean;
  used_today: number;
  used_this_month: number;
  daily_limit_tokens: number;
  monthly_limit_tokens: number;
  created_at: string;
  api_key_hash: string | null;
};

type UsageLog = {
  id: string;
  request_time: string;
  api_key_id: string | null;
  friend_name: string | null;
  model: string | null;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  status: string | null;
  error_message: string | null;
};

const LOG_PAGE = 100;

function AdminPage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [logLimit, setLogLimit] = useState(LOG_PAGE);
  const [filterUser, setFilterUser] = useState<string>("__all__");
  const [filterStatus, setFilterStatus] = useState<string>("__all__");
  const [toast, setToast] = useState<string | null>(null);

  // Create-key form
  const [friendName, setFriendName] = useState("");
  const [dailyLimit, setDailyLimit] = useState(500000);
  const [monthlyLimit, setMonthlyLimit] = useState(2000000);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  // Confirm dialogs
  const [confirm, setConfirm] = useState<null | { title: string; onYes: () => void }>(null);

  // Invite admin
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);
    setInviting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("https://zwbtvtbuuclufbnafdfs.supabase.co/functions/v1/invite-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ email: inviteEmail }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      setInviteSuccess(t({ pt: `Convite enviado para ${inviteEmail}!`, en: `Invite sent to ${inviteEmail}!` }, lang));
      setInviteEmail("");
    } catch (err) {
      setInviteError((err as Error).message);
    } finally {
      setInviting(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/login" });
      else setReady(true);
    });
  }, [navigate]);

  const loadAll = async () => {
    const [k, l] = await Promise.all([
      supabase.from("api_keys").select("*").order("created_at", { ascending: false }),
      supabase.from("usage_logs").select("*").order("request_time", { ascending: false }).limit(logLimit),
    ]);
    if (k.data) setKeys(k.data as ApiKey[]);
    if (l.data) setLogs(l.data as UsageLog[]);
  };

  useEffect(() => { if (ready) loadAll(); /* eslint-disable-next-line */ }, [ready, logLimit]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const copy = async (text: string, msgPt: string, msgEn: string) => {
    await navigator.clipboard.writeText(text);
    showToast(t({ pt: msgPt, en: msgEn }, lang));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const generateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!friendName.trim()) {
      setCreateError(t({ pt: "Informe o nome.", en: "Enter a name." }, lang));
      return;
    }
    setCreating(true);
    try {
      const bytes = new Uint8Array(20);
      crypto.getRandomValues(bytes);
      const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
      const rawKey = `sk-${hex}`;
      const enc = new TextEncoder().encode(rawKey);
      const digest = await crypto.subtle.digest("SHA-256", enc);
      const hashHex = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0")).join("");
      const keyPrefix = rawKey.slice(0, 10);

      const { error } = await supabase.from("api_keys").insert({
        friend_name: friendName.trim(),
        api_key_hash: hashHex,
        key_prefix: keyPrefix,
        is_active: true,
        daily_limit_tokens: dailyLimit,
        monthly_limit_tokens: monthlyLimit,
        used_today: 0,
        used_this_month: 0,
      } as never);
      if (error) throw error;
      setCreatedKey(rawKey);
      setFriendName("");
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const closeModal = async () => {
    setCreatedKey(null);
    await loadAll();
  };

  const toggleActive = async (k: ApiKey) => {
    const newVal = !k.is_active;
    setKeys((prev) => prev.map((x) => (x.id === k.id ? { ...x, is_active: newVal } : x)));
    await supabase.from("api_keys").update({ is_active: newVal }).eq("id", k.id);
  };

  const revoke = (k: ApiKey) =>
    setConfirm({
      title: t({ pt: "Tem certeza? O usuário perderá acesso imediatamente.", en: "Are you sure? The user will lose access immediately." }, lang),
      onYes: async () => {
        await supabase.from("api_keys").update({ is_active: false }).eq("id", k.id);
        setConfirm(null);
        loadAll();
      },
    });

  const remove = (k: ApiKey) =>
    setConfirm({
      title: t({ pt: "Tem certeza? Esta ação não pode ser desfeita.", en: "Are you sure? This action cannot be undone." }, lang),
      onYes: async () => {
        await supabase.from("api_keys").delete().eq("id", k.id);
        setConfirm(null);
        loadAll();
      },
    });

  const stats = useMemo(() => ({
    active: keys.filter((k) => k.is_active).length,
    total: keys.length,
    today: keys.reduce((s, k) => s + Number(k.used_today || 0), 0),
    month: keys.reduce((s, k) => s + Number(k.used_this_month || 0), 0),
  }), [keys]);

  const uniqueUsers = useMemo(() => {
    const s = new Set<string>();
    logs.forEach((l) => l.friend_name && s.add(l.friend_name));
    return Array.from(s).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => logs.filter((l) => {
    if (filterUser !== "__all__" && l.friend_name !== filterUser) return false;
    if (filterStatus !== "__all__" && l.status !== filterStatus) return false;
    return true;
  }), [logs, filterUser, filterStatus]);

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
        {/* SECTION 1: Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <Stat label={t({ pt: "Chaves ativas", en: "Active keys" }, lang)} value={stats.active} />
          <Stat label={t({ pt: "Total de usuários", en: "Total users" }, lang)} value={stats.total} />
          <Stat label={t({ pt: "Tokens hoje", en: "Tokens today" }, lang)} value={stats.today.toLocaleString()} />
          <Stat label={t({ pt: "Tokens no mês", en: "Tokens this month" }, lang)} value={stats.month.toLocaleString()} />
        </section>

        {/* SECTION 2: Create key */}
        <section>
          <h2 className="font-serif text-2xl mb-4">{t({ pt: "Nova chave de acesso", en: "New access key" }, lang)}</h2>
          <form onSubmit={generateKey} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 grid md:grid-cols-4 gap-3 items-end">
            <Field label={t({ pt: "Nome do usuário", en: "User name" }, lang)}>
              <input
                value={friendName}
                onChange={(e) => setFriendName(e.target.value)}
                required
                className="input"
              />
            </Field>
            <Field label={t({ pt: "Limite diário", en: "Daily limit" }, lang)}>
              <input
                type="number"
                min={0}
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                className="input"
              />
            </Field>
            <Field label={t({ pt: "Limite mensal", en: "Monthly limit" }, lang)}>
              <input
                type="number"
                min={0}
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(Number(e.target.value))}
                className="input"
              />
            </Field>
            <button
              type="submit"
              disabled={creating}
              className="bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white px-4 py-2.5 rounded-md text-sm font-medium disabled:opacity-60"
            >
              {creating ? "…" : t({ pt: "Gerar chave", en: "Generate key" }, lang)}
            </button>
            {createError && (
              <div className="md:col-span-4 text-xs px-3 py-2 rounded-md border bg-[var(--warn-bg)] border-[var(--warn-border)] text-[var(--warn-text)]">
                {createError}
              </div>
            )}
          </form>
        </section>

        {/* SECTION 3: Keys table */}
        <section>
          <h2 className="font-serif text-2xl mb-4">{t({ pt: "Chaves de acesso", en: "Access keys" }, lang)}</h2>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-[var(--faint)] bg-[var(--background)]/40">
                  <tr>
                    <Th>{t({ pt: "Usuário", en: "User" }, lang)}</Th>
                    <Th>{t({ pt: "Prefixo", en: "Prefix" }, lang)}</Th>
                    <Th>{t({ pt: "Status", en: "Status" }, lang)}</Th>
                    <Th>{t({ pt: "Hoje", en: "Today" }, lang)}</Th>
                    <Th>{t({ pt: "Mês", en: "Month" }, lang)}</Th>
                    <Th>{t({ pt: "Lim. diário", en: "Daily limit" }, lang)}</Th>
                    <Th>{t({ pt: "Lim. mensal", en: "Monthly limit" }, lang)}</Th>
                    <Th>{t({ pt: "Progresso diário", en: "Daily progress" }, lang)}</Th>
                    <Th>{t({ pt: "Progresso mensal", en: "Monthly progress" }, lang)}</Th>
                    <Th>{t({ pt: "Ações", en: "Actions" }, lang)}</Th>
                  </tr>
                </thead>
                <tbody>
                  {keys.length === 0 && (
                    <tr><td colSpan={10} className="px-4 py-6 text-center text-[var(--faint)]">—</td></tr>
                  )}
                  {keys.map((k) => (
                    <tr key={k.id} className="border-t border-[var(--border)] align-middle">
                      <Td>{k.friend_name}</Td>
                      <Td className="font-mono text-xs">{k.key_prefix}</Td>
                      <Td>
                        <button
                          onClick={() => toggleActive(k)}
                          className={`relative w-9 h-5 rounded-full transition-colors ${k.is_active ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${k.is_active ? "translate-x-4" : ""}`} />
                        </button>
                      </Td>
                      <Td>{Number(k.used_today).toLocaleString()}</Td>
                      <Td>{Number(k.used_this_month).toLocaleString()}</Td>
                      <Td>{Number(k.daily_limit_tokens).toLocaleString()}</Td>
                      <Td>{Number(k.monthly_limit_tokens).toLocaleString()}</Td>
                      <Td><ProgressBar used={Number(k.used_today)} total={Number(k.daily_limit_tokens)} /></Td>
                      <Td><ProgressBar used={Number(k.used_this_month)} total={Number(k.monthly_limit_tokens)} /></Td>
                      <Td>
                        <div className="flex gap-1.5 flex-wrap">
                          <button
                            title={t({ pt: "Apenas o prefixo é salvo. O link só funciona se você salvou a chave bruta na criação.", en: "Only the prefix is stored. The link only works if you kept the raw key from creation." }, lang)}
                            onClick={() => copy(`${window.location.origin}/setup/${k.key_prefix}`, "Link copiado!", "Link copied!")}
                            className="text-xs px-2 py-1 border border-[var(--border)] rounded hover:bg-[var(--background)]"
                          >
                            {t({ pt: "Link setup", en: "Setup link" }, lang)}
                          </button>
                          <button
                            onClick={() => revoke(k)}
                            className="text-xs px-2 py-1 border border-[var(--border)] rounded hover:bg-[var(--background)]"
                          >
                            {t({ pt: "Revogar", en: "Revoke" }, lang)}
                          </button>
                          <button
                            onClick={() => remove(k)}
                            className="text-xs px-2 py-1 border border-[var(--warn-border)] text-[var(--warn-text)] rounded hover:bg-[var(--warn-bg)]"
                          >
                            {t({ pt: "Deletar", en: "Delete" }, lang)}
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 4: Usage Logs */}
        <section>
          <h2 className="font-serif text-2xl mb-4">{t({ pt: "Logs de uso", en: "Usage logs" }, lang)}</h2>
          <div className="flex flex-wrap gap-3 mb-3">
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="input !w-auto"
            >
              <option value="__all__">{t({ pt: "Todos os usuários", en: "All users" }, lang)}</option>
              {uniqueUsers.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input !w-auto"
            >
              <option value="__all__">{t({ pt: "Todos os status", en: "All statuses" }, lang)}</option>
              <option value="ok">ok</option>
              <option value="ok_stream">ok_stream</option>
              <option value="rejected">rejected</option>
              <option value="upstream_error">upstream_error</option>
            </select>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-[var(--faint)] bg-[var(--background)]/40">
                  <tr>
                    <Th>{t({ pt: "Data/Hora", en: "Date/Time" }, lang)}</Th>
                    <Th>{t({ pt: "Usuário", en: "User" }, lang)}</Th>
                    <Th>{t({ pt: "Modelo", en: "Model" }, lang)}</Th>
                    <Th>{t({ pt: "Entrada", en: "Input" }, lang)}</Th>
                    <Th>{t({ pt: "Saída", en: "Output" }, lang)}</Th>
                    <Th>Total</Th>
                    <Th>Status</Th>
                    <Th>{t({ pt: "Erro", en: "Error" }, lang)}</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-6 text-center text-[var(--faint)]">—</td></tr>
                  )}
                  {filteredLogs.map((l) => (
                    <tr key={l.id} className="border-t border-[var(--border)]">
                      <Td className="font-mono text-xs">{fmtDate(l.request_time)}</Td>
                      <Td>{l.friend_name ?? "—"}</Td>
                      <Td className="font-mono text-xs">{l.model ?? "—"}</Td>
                      <Td>{Number(l.input_tokens).toLocaleString()}</Td>
                      <Td>{Number(l.output_tokens).toLocaleString()}</Td>
                      <Td>{Number(l.total_tokens).toLocaleString()}</Td>
                      <Td><StatusPill status={l.status} lang={lang} /></Td>
                      <Td className="max-w-[260px]">
                        {l.error_message ? (
                          <span title={l.error_message} className="text-xs text-[var(--warn-text)]">
                            {l.error_message.length > 50 ? l.error_message.slice(0, 50) + "…" : l.error_message}
                          </span>
                        ) : "—"}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {logs.length >= logLimit && (
            <div className="mt-3 text-center">
              <button
                onClick={() => setLogLimit((n) => n + LOG_PAGE)}
                className="text-sm border border-[var(--border)] px-4 py-2 rounded-md hover:bg-[var(--card)]"
              >
                {t({ pt: "Carregar mais", en: "Load more" }, lang)}
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--foreground)] text-[var(--background)] px-4 py-2 rounded-md text-sm shadow-lg flex items-center gap-2 z-50">
          <Check size={14} /> {toast}
        </div>
      )}

      {/* Created-key modal */}
      {createdKey && (
        <Modal>
          <div className="flex items-start gap-3 p-3 rounded-md bg-[var(--warn-bg)] border border-[var(--warn-border)] text-[var(--warn-text)]">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <p className="text-sm">
              {t({ pt: "Esta chave será exibida apenas uma vez. Guarde-a agora.", en: "This key will only be shown once. Save it now." }, lang)}
            </p>
          </div>

          <div className="mt-4">
            <label className="text-xs uppercase tracking-wider text-[var(--faint)]">
              {t({ pt: "Chave", en: "Key" }, lang)}
            </label>
            <div className="mt-1 flex items-center gap-2 bg-[var(--code-bg)] border border-[var(--border)] rounded-md px-3 py-2">
              <code className="font-mono text-xs break-all flex-1">{createdKey}</code>
              <button
                onClick={() => copy(createdKey, "Chave copiada!", "Key copied!")}
                className="shrink-0 p-1.5 rounded hover:bg-[var(--background)]"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>

          <div className="mt-3">
            <label className="text-xs uppercase tracking-wider text-[var(--faint)]">
              {t({ pt: "Link de setup", en: "Setup link" }, lang)}
            </label>
            <div className="mt-1 flex items-center gap-2 bg-[var(--code-bg)] border border-[var(--border)] rounded-md px-3 py-2">
              <code className="font-mono text-xs break-all flex-1">
                {`${window.location.origin}/setup/${createdKey}`}
              </code>
              <button
                onClick={() => copy(`${window.location.origin}/setup/${createdKey}`, "Link copiado!", "Link copied!")}
                className="shrink-0 p-1.5 rounded hover:bg-[var(--background)]"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>

          <div className="mt-5 flex gap-2 justify-end">
            <button
              onClick={() => copy(`${window.location.origin}/setup/${createdKey}`, "Link copiado!", "Link copied!")}
              className="text-sm border border-[var(--border)] px-3 py-2 rounded-md hover:bg-[var(--background)]"
            >
              {t({ pt: "Copiar link de setup", en: "Copy setup link" }, lang)}
            </button>
            <button
              onClick={closeModal}
              className="text-sm bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white px-4 py-2 rounded-md"
            >
              {t({ pt: "Fechar", en: "Close" }, lang)}
            </button>
          </div>
        </Modal>
      )}

      {/* Confirm dialog */}
      {confirm && (
        <Modal>
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-[var(--warn-text)] mt-0.5 shrink-0" />
            <p className="text-sm">{confirm.title}</p>
          </div>
          <div className="mt-5 flex gap-2 justify-end">
            <button
              onClick={() => setConfirm(null)}
              className="text-sm border border-[var(--border)] px-3 py-2 rounded-md hover:bg-[var(--background)]"
            >
              {t({ pt: "Cancelar", en: "Cancel" }, lang)}
            </button>
            <button
              onClick={confirm.onYes}
              className="text-sm bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white px-4 py-2 rounded-md"
            >
              {t({ pt: "Confirmar", en: "Confirm" }, lang)}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- helpers ---------- */

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium whitespace-nowrap">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-[var(--muted)]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
      <div className="text-xs uppercase tracking-wider text-[var(--faint)]">{label}</div>
      <div className="mt-1 font-serif text-2xl">{value}</div>
    </div>
  );
}
function ProgressBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  let color = "bg-emerald-600";
  if (pct >= 90) color = "bg-[var(--accent-dark)]";
  else if (pct >= 70) color = "bg-amber-500";
  return (
    <div className="w-28">
      <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[10px] text-[var(--faint)] mt-1">{pct.toFixed(0)}%</div>
    </div>
  );
}
function StatusPill({ status, lang: _lang }: { status: string | null; lang: Lang }) {
  if (!status) return <span className="text-[var(--faint)]">—</span>;
  const ok = status === "ok" || status === "ok_stream";
  const cls = ok
    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
    : "bg-[var(--warn-bg)] text-[var(--warn-text)] border-[var(--warn-border)]";
  return <span className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded-full border ${cls}`}>{status}</span>;
}
function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 w-full max-w-lg shadow-xl relative">
        {children}
      </div>
    </div>
  );
}

function fmtDate(s: string) {
  const d = new Date(s);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
