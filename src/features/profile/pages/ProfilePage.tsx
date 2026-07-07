import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMe, sendEmailVerification, simulateEmailVerification } from "../api/me";
import { getPurchases } from "../../purchases/api/purchases";
import { ApiRequestError, type MeResponse, type Purchase } from "../../../shared/api/types";
import AppHeader from "../../../shared/components/AppHeader";
import Icon from "../../../shared/components/Icon";
import { getPlatform } from "../../../shared/catalog/platforms";
import { changePassword } from "../../auth/api/auth";
import { PASSWORD_RULES, passwordIsValid } from "../../auth/model/passwordRules";
import { addNotification } from "../../../shared/notifications/storage";
import { useEscapeKey } from "../../../shared/hooks/useEscapeKey";
import { useBodyScrollLock } from "../../../shared/hooks/useBodyScrollLock";
import ActionBlocker from "../../../shared/components/ActionBlocker";

function memberSince(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ProfilePage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [purchaseTotal, setPurchaseTotal] = useState(0);
  const [latestPurchase, setLatestPurchase] = useState<Purchase | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMe(), getPurchases(1, 20)])
      .then(([profile, purchases]) => {
        setMe(profile);
        setPurchaseTotal(purchases.total);
        setLatestPurchase(purchases.items[0] ?? null);
      })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Erro ao carregar perfil."));
  }, []);

  async function copyUserId() {
    if (!me) return;
    await navigator.clipboard.writeText(me.userId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function requestVerification() {
    if (verificationLoading) return;
    setVerificationLoading(true);
    setVerificationError(null);
    try {
      await sendEmailVerification();
      setVerificationOpen(true);
    } catch (err) {
      setVerificationError(err instanceof Error ? err.message : "Não foi possível enviar a confirmação.");
    } finally {
      setVerificationLoading(false);
    }
  }

  const memberDays = me ? Math.max(1, Math.floor((Date.now() - new Date(me.createdAt).getTime()) / 86400000) + 1) : 0;

  return (
    <div className="dashboard">
      <div className="bg-grid" aria-hidden="true" />
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />
      <AppHeader />

      <main className="profile profile-dashboard">
        {error && <p className="error shake" role="alert">{error}</p>}

        {!me && !error ? (
          <div className="profile-loading"><span className="spinner big" aria-label="Carregando" /><p>Preparando seu perfil…</p></div>
        ) : me && (
          <div className="profile-shell rise">
            <section className="profile-hero-card">
              <div className="profile-hero-art" aria-hidden="true">
                <span className="profile-pixel pixel-one"><Icon name="gamepad" /></span>
                <span className="profile-pixel pixel-two"><Icon name="sparkles" /></span>
                <i /><i /><i />
              </div>
              <div className="profile-hero-content">
                <div className="profile-avatar-large">{me.email[0]?.toUpperCase()}</div>
                <div className="profile-main-identity">
                  <span className="profile-status"><i /> Conta ativa</span>
                  <h1>Meu perfil</h1>
                  <p>{me.email}</p>
                </div>
                <div className="player-badge"><Icon name="gamepad" /><span><small>PERFIL</small><strong>Jogador</strong></span></div>
              </div>
            </section>

            <div className="profile-dashboard-grid">
              <section className={verificationLoading ? "profile-panel account-panel is-action-busy" : "profile-panel account-panel"} aria-busy={verificationLoading}>
                <div className="profile-panel-heading"><div><span className="eyebrow"><Icon name="user" /> Sua conta</span><h2>Informações pessoais</h2><p>Dados usados para identificar e proteger seu acesso.</p></div></div>

                <dl className="account-details">
                  <div><dt><span><Icon name="user" /></span><p>E-mail<strong>{me.email}</strong></p></dt><dd>{me.emailVerified ? <span className="verified-badge"><Icon name="check" /> Verificado</span> : <button type="button" className="verify-email-button" onClick={requestVerification} disabled={verificationLoading}>{verificationLoading ? <span className="spinner" /> : <Icon name="zap" />} {verificationLoading ? "Enviando…" : "Verificar e-mail"}</button>}</dd></div>
                  <div><dt><span><Icon name="calendar" /></span><p>Membro desde<strong>{memberSince(me.createdAt)}</strong></p></dt><dd>{memberDays} {memberDays === 1 ? "dia" : "dias"}</dd></div>
                  <div><dt><span><Icon name="key" /></span><p>ID da conta<strong className="mono">{me.userId}</strong></p></dt><dd><button type="button" className="copy-id" onClick={copyUserId} aria-label="Copiar ID da conta"><Icon name={copied ? "check" : "copy"} /> {copied ? "Copiado" : "Copiar"}</button></dd></div>
                </dl>
                {verificationError && <p className="verification-inline-error shake" role="alert">{verificationError}</p>}

                <div className="security-summary">
                  <span><Icon name="shield" /></span>
                  <div><strong>{me.emailVerified ? "Conta protegida" : "Falta confirmar seu e-mail"}</strong><p>{me.emailVerified ? "Sua sessão está autenticada e o e-mail foi verificado." : "Confirme seu e-mail para aumentar a segurança da conta."}</p></div>
                  {me.emailVerified ? <button type="button" onClick={() => setPasswordOpen(true)}>Alterar senha <Icon name="chevron-right" /></button> : <button type="button" onClick={requestVerification} disabled={verificationLoading}>Enviar confirmação <Icon name="chevron-right" /></button>}
                </div>
                <ActionBlocker active={verificationLoading} label="Enviando confirmação…" />
              </section>

              <aside className="profile-aside">
                <section className="profile-panel profile-stats-panel">
                  <div className="profile-panel-heading compact"><div><span className="eyebrow">Visão geral</span><h2>Sua jornada</h2></div></div>
                  <div className="profile-stats">
                    <div><span><Icon name="bag" /></span><strong>{purchaseTotal}</strong><small>{purchaseTotal === 1 ? "card comprado" : "cards comprados"}</small></div>
                    <div><span><Icon name="calendar" /></span><strong>{memberDays}</strong><small>{memberDays === 1 ? "dia com a gente" : "dias com a gente"}</small></div>
                  </div>
                  {latestPurchase ? (
                    <Link to="/compras" className="latest-purchase" data-platform={latestPurchase.platform}>
                      <span className="platform-logo"><img src={getPlatform(latestPurchase.platform).logo} alt="" /></span>
                      <div><small>Compra mais recente</small><strong>{getPlatform(latestPurchase.platform).shortName} · R$ {latestPurchase.amount}</strong><p>{shortDate(latestPurchase.createdAt)}</p></div>
                      <Icon name="chevron-right" />
                    </Link>
                  ) : <p className="profile-no-purchase">Seu primeiro card vai aparecer aqui.</p>}
                </section>

                <nav className="profile-quick-links" aria-label="Atalhos do perfil">
                  <Link to="/compras"><span><Icon name="bag" /></span><div><strong>Minhas compras</strong><small>Códigos e pedidos</small></div><Icon name="chevron-right" /></Link>
                  <button type="button" onClick={() => setPasswordOpen(true)}><span><Icon name="lock" /></span><div><strong>Alterar senha</strong><small>Segurança da conta</small></div><Icon name="chevron-right" /></button>
                  <Link to="/ajuda"><span><Icon name="help-circle" /></span><div><strong>Ajuda e suporte</strong><small>FAQ e chamados</small></div><Icon name="chevron-right" /></Link>
                </nav>
              </aside>
            </div>
          </div>
        )}
      </main>
      {passwordOpen && <ChangePasswordModal onClose={() => setPasswordOpen(false)} />}
      {verificationOpen && me && (
        <VerificationSentModal
          email={me.email}
          onClose={() => setVerificationOpen(false)}
          onVerified={(profile) => {
            setMe(profile);
            setVerificationOpen(false);
            addNotification({
              kind: "security",
              title: "E-mail confirmado",
              message: "Sua conta foi marcada como verificada nesta simulação.",
            });
          }}
        />
      )}
    </div>
  );
}

function VerificationSentModal({ email, onClose, onVerified }: { email: string; onClose: () => void; onVerified: (profile: MeResponse) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEscapeKey({ onEscape: () => !loading && onClose() });
  useBodyScrollLock();

  async function simulate() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const profile = await simulateEmailVerification();
      onVerified(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível confirmar a conta agora.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="modal-backdrop password-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !loading && onClose()}><section className={loading ? "password-modal verification-sent-modal rise is-action-busy" : "password-modal verification-sent-modal rise"} role="dialog" aria-modal="true" aria-labelledby="verification-sent-title" aria-busy={loading}><button className="modal-close" type="button" onClick={onClose} aria-label="Fechar" disabled={loading}><span aria-hidden="true">×</span></button><div className="verification-mail-icon"><Icon name="sparkles" /><span>✉</span></div><span className="eyebrow">Confira sua caixa de entrada</span><h2 id="verification-sent-title">Confirmação enviada!</h2><p>Enviamos um link para <strong>{email}</strong>. Abra a mensagem e confirme seu e-mail para deixar a conta totalmente protegida.</p><div className="verification-tip"><Icon name="help-circle" /><span>Não encontrou? Confira também as pastas de spam e promoções.</span></div>{error && <p className="verification-inline-error shake" role="alert">{error}</p>}<div className="verification-actions"><button type="button" className="btn-secondary simulation-confirm-button" onClick={simulate} disabled={loading}><Icon name="sparkles" /> Simular confirmação</button><button type="button" className="btn-primary" onClick={onClose} disabled={loading}>Entendi</button></div><ActionBlocker active={loading} label="Confirmando conta…" /></section></div>;
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  useBodyScrollLock();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const matches = newPassword === confirmPassword;
  const canSubmit = currentPassword.length > 0 && passwordIsValid(newPassword) && matches && currentPassword !== newPassword;

  useEscapeKey({ enabled: true, onEscape: () => !loading && onClose() });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
    try {
      await changePassword(currentPassword, newPassword);
      addNotification({ kind: "security", title: "Senha alterada", message: "A senha da sua conta foi atualizada com segurança." });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível alterar sua senha.");
    } finally {
      setLoading(false);
    }
  }

  if (success) return (
    <div className="modal-backdrop password-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="password-modal password-success-modal rise" role="dialog" aria-modal="true" aria-labelledby="password-success-title">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Fechar"><span aria-hidden="true">×</span></button>
        <div className="password-success-icon"><Icon name="check" /></div>
        <span className="eyebrow"><Icon name="sparkles" /> Tudo certo</span>
        <h2 id="password-success-title">Senha renovada!</h2>
        <p>Sua nova senha já está protegendo a conta. Continue jogando tranquilo.</p>
        <button type="button" className="btn-primary" onClick={onClose}>Voltar ao meu perfil</button>
      </section>
    </div>
  );

  const fields = [
    { key: "current" as const, label: "Senha atual", value: currentPassword, set: setCurrentPassword, autoComplete: "current-password" },
    { key: "next" as const, label: "Nova senha", value: newPassword, set: setNewPassword, autoComplete: "new-password" },
    { key: "confirm" as const, label: "Confirmar nova senha", value: confirmPassword, set: setConfirmPassword, autoComplete: "new-password" },
  ];

  return (
    <div className="modal-backdrop password-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !loading && onClose()}>
      <section className={loading ? "password-modal rise is-action-busy" : "password-modal rise"} role="dialog" aria-modal="true" aria-labelledby="change-password-title" aria-busy={loading}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Fechar" disabled={loading}><span aria-hidden="true">×</span></button>
        <header className="password-modal-header"><span><Icon name="key" /></span><div><span className="eyebrow">Segurança da conta</span><h2 id="change-password-title">Crie uma nova senha</h2><p>Confirme sua identidade e escolha uma senha forte.</p></div></header>
        <form onSubmit={submit} className="change-password-form">
          <fieldset disabled={loading}>
          {fields.map((field) => <label className="password-field" key={field.key}><span>{field.label}</span><div><Icon name="lock" /><input type={visible[field.key] ? "text" : "password"} value={field.value} onChange={(event) => field.set(event.target.value)} autoComplete={field.autoComplete} required /><button type="button" onClick={() => setVisible((state) => ({ ...state, [field.key]: !state[field.key] }))} aria-label={visible[field.key] ? `Ocultar ${field.label.toLowerCase()}` : `Mostrar ${field.label.toLowerCase()}`}><Icon name={visible[field.key] ? "eye-off" : "eye"} /></button></div></label>)}
          <div className="password-strength-card"><div className="password-strength-heading"><span>Requisitos da senha</span><small>{PASSWORD_RULES.filter((rule) => rule.test(newPassword)).length} de {PASSWORD_RULES.length}</small></div><ul>{PASSWORD_RULES.map((rule) => { const ok = rule.test(newPassword); return <li className={ok ? "ok" : ""} key={rule.label}><span>{ok ? "✓" : "•"}</span>{rule.label}</li>; })}<li className={confirmPassword.length > 0 && matches ? "ok" : ""}><span>{confirmPassword.length > 0 && matches ? "✓" : "•"}</span>As senhas coincidem</li><li className={newPassword.length > 0 && currentPassword !== newPassword ? "ok" : ""}><span>{newPassword.length > 0 && currentPassword !== newPassword ? "✓" : "•"}</span>Diferente da senha atual</li></ul></div>
          {error && <p className="password-form-error shake" role="alert"><Icon name="shield" /> {error}</p>}
          <div className="password-modal-actions"><button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button><button type="submit" className="btn-primary" disabled={!canSubmit || loading}>{loading ? <><span className="spinner" /> Alterando…</> : <><Icon name="shield" /> Alterar senha</>}</button></div>
          <p className="password-privacy"><Icon name="lock" /> Sua senha nunca fica visível e é enviada de forma protegida.</p>
          </fieldset>
        </form>
        <ActionBlocker active={loading} label="Alterando senha…" />
      </section>
    </div>
  );
}
