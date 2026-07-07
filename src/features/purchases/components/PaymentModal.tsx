import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { purchaseCard } from "../api/purchases";
import { ApiRequestError, type PurchaseDetail } from "../../../shared/api/types";
import GiftCardVisual from "./GiftCardVisual";
import Icon, { type IconName } from "../../../shared/components/Icon";
import { getPlatform, type PlatformId } from "../../../shared/catalog/platforms";
import { addNotification } from "../../../shared/notifications/storage";
import { useEscapeKey } from "../../../shared/hooks/useEscapeKey";
import { useBodyScrollLock } from "../../../shared/hooks/useBodyScrollLock";

type Step = "method" | "pix" | "card" | "processing" | "success";

interface Props {
  amount: number;
  platform: PlatformId;
  onClose: () => void;
}

const METHODS = [
  { id: "pix", label: "PIX", icon: "pix", desc: "QR Code ou Copia e Cola" },
  { id: "card", label: "Cartão", icon: "credit-card", desc: "Crédito em ambiente de teste" },
] as const;

function finderCell(x: number, y: number, originX: number, originY: number): boolean {
  const dx = x - originX;
  const dy = y - originY;
  if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return false;
  return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
}

const QR_CELLS = Array.from({ length: 21 * 21 }, (_, index) => {
  const x = index % 21;
  const y = Math.floor(index / 21);
  const finder = finderCell(x, y, 0, 0) || finderCell(x, y, 14, 0) || finderCell(x, y, 0, 14);
  const reserved = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
  return finder || (!reserved && ((x * 7 + y * 11 + x * y) % 5 < 2));
});

function DemoQrCode() {
  return (
    <svg className="demo-qr" viewBox="0 0 21 21" role="img" aria-label="QR Code demonstrativo não pagável">
      <rect width="21" height="21" rx="1" fill="#fff" />
      {QR_CELLS.map((filled, index) => filled && <rect key={index} x={index % 21} y={Math.floor(index / 21)} width="1" height="1" rx="0.08" fill="currentColor" />)}
    </svg>
  );
}

export default function PaymentModal({ amount, platform, onClose }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("method");
  const [method, setMethod] = useState<"pix" | "card">("pix");
  const [error, setError] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixSeconds, setPixSeconds] = useState(10 * 60);
  const pixCode = `PIX-DEMO-VIRTUALGAMECARD-${platform.toUpperCase()}-R${amount}-NAO-PAGAVEL`;

  useEscapeKey({ mode: "block" });
  useBodyScrollLock();

  useEffect(() => {
    if (step !== "pix" || pixSeconds <= 0) return;
    const timer = window.setInterval(() => setPixSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [pixSeconds, step]);

  async function handlePay() {
    setError(null);
    setStep("processing");
    const start = Date.now();
    try {
      const result = await purchaseCard(amount, platform, method);
      const elapsed = Date.now() - start;
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, 1400 - elapsed)));
      setPurchase(result);
      addNotification({
        kind: "purchase",
        title: result.status === "approved" ? "Seu card está pronto!" : "Pedido recebido",
        message: result.status === "approved"
          ? `${getPlatform(platform).name} de R$ ${amount},00 disponível em Minhas Compras.`
          : "Estamos aguardando a confirmação segura do pagamento.",
      });
      setStep("success");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Falha no pagamento. Tente novamente.");
      setStep(method);
    }
  }

  async function handleCopy() {
    if (!purchase?.code) return;
    await navigator.clipboard.writeText(purchase.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function copyPix() {
    await navigator.clipboard.writeText(pixCode);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 1800);
  }

  const minutes = String(Math.floor(pixSeconds / 60)).padStart(2, "0");
  const seconds = String(pixSeconds % 60).padStart(2, "0");

  return (
    <div className="overlay payment-overlay">
      <div className={`modal payment-modal payment-${step} rise`} role="dialog" aria-modal="true" aria-labelledby="payment-title">
        {step === "method" && (
          <>
            <button className="modal-close" type="button" onClick={onClose} aria-label="Fechar">×</button>
            <span className="eyebrow"><Icon name="shield" /> Checkout seguro · demonstração</span>
            <h2 className="modal-title" id="payment-title">Como deseja pagar?</h2>
            <p className="modal-sub"><strong>{getPlatform(platform).name}</strong> de <strong>R$ {amount},00</strong></p>

            <div className="method-row">
              {METHODS.map((item) => (
                <button key={item.id} type="button" className={method === item.id ? "method-card selected" : "method-card"} onClick={() => setMethod(item.id)}>
                  <span className="method-icon"><Icon name={item.icon as IconName} /></span>
                  <span className="method-label">{item.label}</span>
                  <span className="method-desc">{item.desc}</span>
                </button>
              ))}
            </div>

            <div className="checkout-total"><span>Total</span><strong>R$ {amount},00</strong></div>
            <button type="button" className="btn-primary" onClick={() => setStep(method)}>
              Continuar com {method === "pix" ? "PIX" : "cartão"} <Icon name="chevron-right" />
            </button>
            <button type="button" className="link-muted as-btn" onClick={onClose}>Cancelar compra</button>
          </>
        )}

        {step === "pix" && (
          <div className="payment-flow pix-flow">
            <header className="payment-flow-head">
              <button type="button" className="flow-back" onClick={() => setStep("method")}><Icon name="chevron-left" /> Voltar</button>
              <span className="demo-badge">DEMONSTRAÇÃO</span>
            </header>
            <span className="method-icon flow-icon"><Icon name="pix" /></span>
            <h2 className="modal-title" id="payment-title">Pague com PIX</h2>
            <p className="modal-sub">Abra o app do banco, escaneie o QR ou use o código.</p>

            <div className="pix-content">
              <div className="qr-shell"><DemoQrCode /><span>QR não pagável</span></div>
              <div className="pix-instructions">
                <ol><li><span>1</span>Abra o app do seu banco</li><li><span>2</span>Escolha PIX e leia o QR Code</li><li><span>3</span>Confira e confirme no aplicativo</li></ol>
                <div className="pix-expiry"><span>Expira em</span><strong>{minutes}:{seconds}</strong></div>
              </div>
            </div>

            <label className="readonly-field"><span>PIX Copia e Cola fictício</span><div><input value={pixCode} readOnly aria-readonly="true" tabIndex={-1} /><button type="button" onClick={copyPix} aria-label="Copiar PIX fictício"><Icon name={pixCopied ? "check" : "copy"} /></button></div></label>
            <div className="demo-warning"><Icon name="shield" /><span><strong>Ambiente de demonstração.</strong> Este QR e código não realizam pagamentos.</span></div>
            {error && <p className="error shake" role="alert">{error}</p>}
            <button type="button" className="btn-primary" onClick={handlePay} disabled={pixSeconds === 0}>Já fiz o pagamento simulado <Icon name="chevron-right" /></button>
            <button type="button" className="link-muted as-btn" onClick={onClose}>Cancelar compra</button>
          </div>
        )}

        {step === "card" && (
          <div className="payment-flow card-flow">
            <header className="payment-flow-head">
              <button type="button" className="flow-back" onClick={() => setStep("method")}><Icon name="chevron-left" /> Voltar</button>
              <span className="demo-badge">CARTÃO DE TESTE</span>
            </header>
            <span className="method-icon flow-icon"><Icon name="credit-card" /></span>
            <h2 className="modal-title" id="payment-title">Cartão de crédito</h2>
            <p className="modal-sub">Dados fictícios e bloqueados para esta demonstração.</p>

            <div className="demo-credit-card">
              <div><span className="gc-chip" /><strong>VISA</strong></div>
              <code>4242 4242 4242 4242</code>
              <div><span>JOGADOR DEMONSTRAÇÃO</span><span>12/34</span></div>
            </div>

            <div className="readonly-card-form">
              <label className="readonly-field full"><span>Número do cartão</span><div><input value="4242 4242 4242 4242" readOnly aria-readonly="true" tabIndex={-1} /><Icon name="lock" /></div></label>
              <label className="readonly-field full"><span>Nome impresso</span><div><input value="JOGADOR DEMONSTRAÇÃO" readOnly aria-readonly="true" tabIndex={-1} /><Icon name="lock" /></div></label>
              <label className="readonly-field"><span>Validade</span><div><input value="12/34" readOnly aria-readonly="true" tabIndex={-1} /><Icon name="lock" /></div></label>
              <label className="readonly-field"><span>CVV</span><div><input value="123" readOnly aria-readonly="true" tabIndex={-1} /><Icon name="lock" /></div></label>
              <label className="readonly-field full"><span>Parcelamento</span><div><input value={`1x de R$ ${amount},00 sem juros`} readOnly aria-readonly="true" tabIndex={-1} /><Icon name="lock" /></div></label>
            </div>

            <div className="demo-warning"><Icon name="shield" /><span><strong>Sem cobrança real.</strong> O número 4242 é destinado a testes de integração.</span></div>
            {error && <p className="error shake" role="alert">{error}</p>}
            <button type="button" className="btn-primary" onClick={handlePay}>Autorizar pagamento simulado <Icon name="chevron-right" /></button>
            <button type="button" className="link-muted as-btn" onClick={onClose}>Cancelar compra</button>
          </div>
        )}

        {step === "processing" && (
          <div className="processing">
            <div className="pay-orbit"><span className="pay-core"><Icon name={method === "pix" ? "pix" : "credit-card"} /></span></div>
            <h2 className="modal-title" id="payment-title">Confirmando pagamento…</h2>
            <p className="modal-sub">Não feche esta janela</p>
          </div>
        )}

        {step === "success" && purchase && (
          <div className="pay-success">
            <div className="check-pop" aria-hidden="true"><Icon name="check" /></div>
            <h2 className="modal-title" id="payment-title">{purchase.status === "approved" ? "Pagamento aprovado!" : "Pedido recebido!"}</h2>
            <p className="modal-sub">{purchase.status === "approved" ? "Seu gift card está pronto para usar." : "O card será liberado assim que o provedor confirmar o pagamento."}</p>
            <div className="success-card"><GiftCardVisual amount={purchase.amount} platform={purchase.platform} size="md" code={purchase.code && showCode ? purchase.code : "••••-••••-••••-••••"} /></div>
            {purchase.code && <div className="code-row">
              <button type="button" className="btn-ghost eye-btn" onClick={() => setShowCode((value) => !value)} aria-label={showCode ? "Ocultar código" : "Mostrar código"}><Icon name={showCode ? "eye-off" : "eye"} /> {showCode ? "Ocultar" : "Mostrar código"}</button>
              <button type="button" className="btn-ghost" onClick={handleCopy}><Icon name={copied ? "check" : "copy"} /> {copied ? "Copiado!" : "Copiar"}</button>
            </div>}
            <button type="button" className="btn-primary" onClick={() => navigate("/compras")}>Ver em Minhas Compras <Icon name="chevron-right" /></button>
            <button type="button" className="link-muted as-btn" onClick={onClose}>Comprar outro</button>
          </div>
        )}
      </div>
    </div>
  );
}
