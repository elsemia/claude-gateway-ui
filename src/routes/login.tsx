import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useLang, t } from "@/lib/i18n";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/admin" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        right={
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
            <ArrowLeft size={14} /> {t({ pt: "Voltar", en: "Back" }, lang)}
          </Link>
        }
      />
      <main className="max-w-md mx-auto px-6 mt-12">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
          <h1 className="font-serif text-2xl">
            {t({ pt: "Área do Administrador", en: "Admin Area" }, lang)}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {t({ pt: "Acesse o painel de gerenciamento.", en: "Access the management panel." }, lang)}
          </p>

          <form onSubmit={submit} className="space-y-3 mt-5">
            <div>
              <label className="text-xs text-[var(--muted)]">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)]">
                {t({ pt: "Senha", en: "Password" }, lang)}
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
            {error && (
              <div className="text-xs px-3 py-2 rounded-md border bg-[var(--warn-bg)] border-[var(--warn-border)] text-[var(--warn-text)]">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white py-2.5 rounded-md text-sm font-medium disabled:opacity-60"
            >
              {loading ? "…" : t({ pt: "Entrar", en: "Sign in" }, lang)}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
