import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth";
import { ApiRequestError } from "../../../shared/api/types";
import { PASSWORD_RULES, passwordIsValid } from "../model/passwordRules";
import ThemeToggle from "../../../shared/components/ThemeToggle";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const passwordsMatch = password === confirm;
  const valid = passwordIsValid(password) && passwordsMatch && token.length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/", { replace: true }), 2000);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Ocorreu um erro inesperado.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-screen">
      <ThemeToggle floating />
      <div className="bg-grid" aria-hidden="true" />
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />
      <div className="auth-card rise">
        <div className="brand">
          <span className="brand-logo">▶</span>
          <span className="brand-name">VirtualGameCard</span>
        </div>
        <h1 className="page-title">Nova senha</h1>

        {done ? (
          <div className="notice">
            <p>✓ Senha redefinida com sucesso!</p>
            <p className="tagline">Redirecionando para o login…</p>
          </div>
        ) : !token ? (
          <div className="notice">
            <p className="error">Link inválido: token ausente.</p>
            <Link to="/esqueci-senha" className="link-muted">
              Solicitar novo link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="field">
              <span>Nova senha</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </label>

            <label className="field">
              <span>Confirmar nova senha</span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </label>

            <ul className="password-checklist" aria-label="Requisitos da senha">
              {PASSWORD_RULES.map((rule) => {
                const ok = rule.test(password);
                return (
                  <li key={rule.id} className={ok ? "rule ok" : "rule"}>
                    <span aria-hidden="true">{ok ? "✓" : "•"}</span> {rule.label}
                  </li>
                );
              })}
              <li className={confirm.length > 0 && passwordsMatch ? "rule ok" : "rule"}>
                <span aria-hidden="true">
                  {confirm.length > 0 && passwordsMatch ? "✓" : "•"}
                </span>{" "}
                Senhas iguais
              </li>
            </ul>

            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary" disabled={loading || !valid}>
              {loading ? "Salvando…" : "Redefinir senha"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
