import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/auth";
import { ApiRequestError } from "../../../shared/api/types";
import ThemeToggle from "../../../shared/components/ThemeToggle";
import ActionBlocker from "../../../shared/components/ActionBlocker";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  /** Só chega preenchido em ambiente de desenvolvimento (sem serviço de e-mail). */
  const [devToken, setDevToken] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setMessage(res.message);
      setDevToken(res.resetToken);
      setSent(true);
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
      <div className={loading ? "auth-card rise is-action-busy" : "auth-card rise"} aria-busy={loading}>
        <div className="brand">
          <span className="brand-logo">▶</span>
          <span className="brand-name">VirtualGameCard</span>
        </div>
        <h1 className="page-title">Recuperar senha</h1>

        {sent ? (
          <div className="notice">
            <p>{message}</p>
            {devToken && (
              <div className="dev-token">
                <p className="dev-token-label">
                  🔧 Modo desenvolvimento — link de redefinição:
                </p>
                <Link to={`/redefinir-senha?token=${devToken}`} className="btn-primary as-link">
                  Redefinir minha senha agora
                </Link>
              </div>
            )}
            <Link to="/" className="link-muted">
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <fieldset disabled={loading}>
            <p className="tagline">
              Informe seu e-mail e enviaremos instruções para redefinir a senha.
            </p>

            <label className="field">
              <span>E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                autoComplete="email"
                required
              />
            </label>

            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Enviando…" : "Enviar instruções"}
            </button>

            <Link to="/" className="link-muted">
              Voltar para o login
            </Link>
            </fieldset>
          </form>
        )}
        <ActionBlocker active={loading} label="Enviando instruções…" />
      </div>
    </main>
  );
}
