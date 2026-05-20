import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useLang, t } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (password !== confirm) {
      setError(t({ pt: "As senhas não coincidem.", en: "Passwords do not match." }, lang));
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(t({ pt: "Senha definida com sucesso!", en: "Password set successfully!" }, lang));
      setTimeout(() => navigate({ to: "/admin" }), 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-md mx-auto px-6 mt-12">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
          <h1 className="font-serif text-2xl">
            {t({ pt: "Definir senha", en: "Set password" }, lang)}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {t({ pt: "Crie uma senha para acessar o painel.", en: "Create a password to access the panel." }, lang)}
          </p>
          <form onSubmit={submit} className="space-y-3 mt-5">
            <div>
              <label className="text-xs text-[var(--muted)]">
                {t({ pt: "Nova senha", en: "New password" }, lang)}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)]">
                {t({ pt: "Confirmar senha", en: "Confirm password" }, lang)}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            {error && (
              <div className="text-xs px-3 py-2 rounded-md border bg-[var(--warn-bg)] border-[var(--warn-border)] text-[var(--warn-text)]">
                {error}
              </div>
            )}
            {success && (
              <div className="text-xs px-3 py-2 rounded-md border bg-[var(--warn-bg)] border-[var(--warn-border)] text-[var(--warn-text)]">
                {success}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white py-2.5 rounded-md text-sm font-medium disabled:opacity-60"
            >
              {loading ? "…" : t({ pt: "Definir senha", en: "Set password" }, lang)}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
