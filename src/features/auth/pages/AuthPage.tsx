import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, register } from "../api/auth";
import { ApiRequestError } from "../../../shared/api/types";
import { PASSWORD_RULES, passwordIsValid } from "../model/passwordRules";
import { saveSession } from "../model/storage";
import Icon from "../../../shared/components/Icon";
import ThemeToggle from "../../../shared/components/ThemeToggle";
import ActionBlocker from "../../../shared/components/ActionBlocker";

type Tab = "login" | "register";

export default function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordsMatch = password === confirm;
  const registerValid =
    email.length > 0 && passwordIsValid(password) && passwordsMatch;

  function switchTab(next: Tab) {
    if (loading) return;
    setTab(next);
    setError(null);
    setConfirm("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const result =
        tab === "login"
          ? await login(email, password)
          : await register(email, password);
      saveSession(result.token, result.userId);
      navigate("/painel", { replace: true });
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
    <main className="auth-screen split">
      <ThemeToggle floating />
      {/* fundo animado */}
      <div className="bg-grid" aria-hidden="true" />
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />

      {/* ===== Hero: gift cards flutuantes ===== */}
      <section className="hero" aria-hidden="true">
        <div className="card-stack">
          <div className="gift-card gc-back-2">
            <span className="gc-value">R$ 100</span>
          </div>
          <div className="gift-card gc-back-1">
            <span className="gc-value">R$ 50</span>
          </div>
          <div className="gift-card gc-front">
            <div className="gc-top">
            <span className="gc-brand"><i className="brand-glyph">V</i> VirtualGameCard</span>
              <span className="gc-chip" />
            </div>
            <span className="gc-value big">R$ 250</span>
            <div className="gc-bottom">
              <span className="gc-code">•••• •••• ••••</span>
              <span className="gc-tag">GAME CARD</span>
            </div>
            <div className="gc-shine" />
          </div>
        </div>

        <h1 className="hero-title">
          Créditos para seus <span className="grad-text">jogos favoritos</span>
        </h1>
        <p className="hero-sub">
          Compre gift cards e receba o código na hora. Sem filas, sem espera.
        </p>

        <ul className="hero-perks">
          <li><Icon name="zap" /> Entrega instantânea</li>
          <li><Icon name="shield" /> Pagamento seguro</li>
          <li><Icon name="gamepad" /> Todas as plataformas</li>
        </ul>
      </section>

      {/* ===== Formulário ===== */}
      <div className={loading ? "auth-card rise is-action-busy" : "auth-card rise"} aria-busy={loading}>
        <div className="brand">
          <span className="brand-logo"><span>V</span></span>
          <span className="brand-name">VirtualGameCard</span>
        </div>
        <p className="tagline">Gift cards de games, na hora.</p>

        <div className="tabs" role="tablist">
          <span
            className="tab-glider"
            style={{ transform: tab === "login" ? "translateX(0)" : "translateX(100%)" }}
          />
          <button
            role="tab"
            aria-selected={tab === "login"}
            className={tab === "login" ? "tab active" : "tab"}
            onClick={() => switchTab("login")}
            type="button"
            disabled={loading}
          >
            Entrar
          </button>
          <button
            role="tab"
            aria-selected={tab === "register"}
            className={tab === "register" ? "tab active" : "tab"}
            onClick={() => switchTab("register")}
            type="button"
            disabled={loading}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={handleSubmit} key={tab} className="form-swap">
          <fieldset disabled={loading}>
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

          <label className="field">
            <span>Senha</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              required
            />
          </label>

          {tab === "register" && (
            <>
              <label className="field">
                <span>Confirmar senha</span>
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
                <li
                  className={
                    confirm.length > 0 && passwordsMatch ? "rule ok" : "rule"
                  }
                >
                  <span aria-hidden="true">
                    {confirm.length > 0 && passwordsMatch ? "✓" : "•"}
                  </span>{" "}
                  Senhas iguais
                </li>
              </ul>
            </>
          )}

          {error && (
            <p className="error shake" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || (tab === "register" && !registerValid)}
          >
            {loading ? (
              <span className="spinner" aria-label="Carregando" />
            ) : tab === "login" ? (
              "Entrar"
            ) : (
              "Criar conta"
            )}
          </button>
          </fieldset>
        </form>

        {tab === "login" && (
          <Link to="/esqueci-senha" className="link-muted" aria-disabled={loading} onClick={(event) => loading && event.preventDefault()}>
            Esqueci minha senha
          </Link>
        )}
        <ActionBlocker active={loading} label={tab === "login" ? "Entrando com segurança…" : "Criando sua conta…"} />
      </div>
    </main>
  );
}
