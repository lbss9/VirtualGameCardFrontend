import { useEffect, useRef, useState, type FormEvent } from "react";
import AppHeader from "../../../shared/components/AppHeader";
import Icon from "../../../shared/components/Icon";
import { createSupportTicket } from "../api/support";
import { ApiRequestError } from "../../../shared/api/types";
import { addNotification } from "../../../shared/notifications/storage";
import ActionBlocker from "../../../shared/components/ActionBlocker";

const FAQS = [
  ["Como recebo o código do meu card?", "O código é liberado logo após a aprovação e fica disponível em Minhas Compras. Use o ícone de olho para revelá-lo."],
  ["Meu código não funcionou. O que faço?", "Confira se a plataforma e a região da conta estão corretas. Se o problema continuar, abra um chamado abaixo com o número do pedido."],
  ["Posso trocar a plataforma depois da compra?", "Não. Códigos digitais são emitidos especificamente para a plataforma escolhida. Revise a seleção antes do pagamento."],
  ["Onde acompanho meus chamados?", "As atualizações aparecem na Central de Notificações. Quando o backend estiver conectado, esta página também exibirá o histórico completo."],
];

const CATEGORIES = [
  { id: "code", label: "Código do card", icon: "key" },
  { id: "payment", label: "Pagamento", icon: "credit-card" },
  { id: "account", label: "Conta e acesso", icon: "user" },
  { id: "other", label: "Outro assunto", icon: "help-circle" },
] as const;

function CategorySelect({ value, onChange, disabled = false }: { value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = CATEGORIES.find((item) => item.id === value) ?? CATEGORIES[0];

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [open]);

  return (
    <div className="category-select" ref={ref}>
      <button type="button" className={open ? "category-trigger open" : "category-trigger"} onClick={() => !disabled && setOpen((current) => !current)} aria-expanded={open} aria-controls="support-category-options" disabled={disabled}>
        <span><Icon name={selected.icon} /> {selected.label}</span>
        <Icon name="chevron-down" />
      </button>
      {open && (
        <div className="category-options" id="support-category-options" aria-label="Categorias disponíveis">
          {CATEGORIES.map((item) => (
            <button key={item.id} type="button" aria-pressed={item.id === value} onClick={() => { onChange(item.id); setOpen(false); }}>
              <span className="category-option-icon"><Icon name={item.icon} /></span>
              <span><strong>{item.label}</strong><small>{item.id === "code" ? "Resgate e ativação" : item.id === "payment" ? "PIX ou cartão" : item.id === "account" ? "Login e segurança" : "Falar com a equipe"}</small></span>
              {item.id === value && <Icon name="check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [category, setCategory] = useState("code");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await createSupportTicket({ category, subject, message });
      const shortId = result.id.slice(0, 8).toUpperCase();
      setTicket(shortId);
      addNotification({ kind: "support", title: "Chamado recebido", message: `O protocolo #${shortId} foi aberto e já está na fila do suporte.` });
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Não foi possível abrir o chamado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dashboard">
      <div className="bg-grid" aria-hidden="true" />
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />
      <AppHeader />

      <main className="help-page">
        <section className="help-hero rise">
          <span className="help-mascot"><Icon name="help-circle" /></span>
          <div><span className="eyebrow"><Icon name="sparkles" /> Estamos por perto</span><h1>Como podemos ajudar?</h1><p>Encontre uma resposta rápida ou conte para a gente o que aconteceu.</p></div>
        </section>

        <div className="help-layout">
          <section className="faq-card rise">
            <div className="section-heading"><span><Icon name="gamepad" /></span><div><h2>Perguntas frequentes</h2><p>As dúvidas mais comuns da comunidade.</p></div></div>
            <div className="faq-list">
              {FAQS.map(([question, answer]) => (
                <details key={question}><summary>{question}<Icon name="chevron-down" /></summary><p>{answer}</p></details>
              ))}
            </div>
          </section>

          <section className={loading ? "support-card rise is-action-busy" : "support-card rise"} aria-busy={loading}>
            <div className="section-heading"><span><Icon name="help-circle" /></span><div><h2>Falar com o suporte</h2><p>Respondemos assim que possível.</p></div></div>
            {ticket ? (
              <div className="ticket-success"><span><Icon name="check" /></span><h3>Chamado aberto!</h3><p>Seu protocolo é <strong>#{ticket}</strong>. Avisaremos nas notificações quando houver novidade.</p><button type="button" className="btn-ghost" onClick={() => setTicket(null)}>Abrir outro chamado</button></div>
            ) : (
              <form onSubmit={submit} className="support-form">
                <fieldset disabled={loading}>
                <label><span>Assunto</span><input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Ex.: código não foi aceito" required minLength={4} /></label>
                <div className="support-form-field"><span>Categoria</span><CategorySelect value={category} onChange={setCategory} disabled={loading} /></div>
                <label><span>Como podemos ajudar?</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Conte os detalhes e, se houver, informe o número do pedido." required minLength={10} rows={5} /></label>
                {error && <p className="error" role="alert">{error}</p>}
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? <span className="spinner" /> : <><Icon name="sparkles" /> Enviar para o suporte</>}</button>
                <p className="support-note"><Icon name="shield" /> Nunca envie sua senha ou o código completo do card.</p>
                </fieldset>
              </form>
            )}
            <ActionBlocker active={loading} label="Abrindo chamado…" />
          </section>
        </div>
      </main>
    </div>
  );
}
