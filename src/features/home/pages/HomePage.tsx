import { useState } from "react";
import AppHeader from "../../../shared/components/AppHeader";
import GiftCardVisual from "../../purchases/components/GiftCardVisual";
import PaymentModal from "../../purchases/components/PaymentModal";
import Icon from "../../../shared/components/Icon";
import { PLATFORMS, getPlatform, type PlatformId } from "../../../shared/catalog/platforms";

const MIN = 5;
const MAX = 250;
const STEP = 5;
const QUICK_VALUES = [10, 25, 50, 100, 150, 250];

export default function HomePage() {
  const [amount, setAmount] = useState(50);
  const [platform, setPlatform] = useState<PlatformId>("steam");
  const [paying, setPaying] = useState(false);

  function nudge(direction: -1 | 1) {
    setAmount((current) => Math.min(MAX, Math.max(MIN, current + direction * STEP)));
  }

  return (
    <div className="dashboard">
      <div className="bg-grid" aria-hidden="true" />
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />

      <AppHeader />

      <main className="store">
        <section className="store-hero rise">
          <span className="eyebrow"><Icon name="sparkles" /> Crédito gamer, sem espera</span>
          <h1 className="store-title">
            Seu próximo jogo começa com um{" "}
            <span className="grad-text">Game Card</span>
          </h1>
          <p className="store-sub">
            Escolha de R$ {MIN} a R$ {MAX}. Pagou, recebeu — simples assim.
          </p>
        </section>

        <section className="purchase-journey rise" aria-label="Configure seu game card em três passos">
          <div className="journey-step platform-section" aria-labelledby="platform-title">
            <div className="platform-heading">
              <div>
                <span className="picker-step">PASSO 1 DE 3</span>
                <h2 id="platform-title">Onde vai jogar?</h2>
                <p>Escolha a loja do seu crédito.</p>
              </div>
              <span className="step-badge">01</span>
            </div>
            <div className="platform-grid">
              {PLATFORMS.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={platform === item.id ? "platform-option selected" : "platform-option"}
                  data-platform={item.id}
                  aria-pressed={platform === item.id}
                  onClick={() => setPlatform(item.id)}
                >
                  <span className="platform-logo"><img src={item.logo} alt="" /></span>
                  <span><strong>{item.shortName}</strong><small>{item.description}</small></span>
                  <i className="platform-check"><Icon name="check" /></i>
                </button>
              ))}
            </div>
          </div>

          <div className="journey-connector" aria-hidden="true"><Icon name="chevron-right" /></div>

          <div className="journey-step store-picker">
            <div className="picker-heading">
              <div>
                <span className="picker-step">PASSO 2 DE 3</span>
                <h2>Escolha o valor</h2>
              </div>
              <span className="step-badge">02</span>
            </div>

            <div className="amount-control">
              <button type="button" onClick={() => nudge(-1)} disabled={amount === MIN} aria-label="Diminuir R$ 5">−</button>
              <div className="amount-display" key={amount}>
                <span className="amount-currency">R$</span>
                <span className="amount-value">{amount}</span>
                <span className="amount-cents">,00</span>
              </div>
              <button type="button" onClick={() => nudge(1)} disabled={amount === MAX} aria-label="Aumentar R$ 5">+</button>
            </div>

            <input
              type="range"
              className="amount-slider"
              min={MIN}
              max={MAX}
              step={STEP}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              aria-label="Valor do gift card"
              style={{
                // preenche a trilha até o valor atual
                background: `linear-gradient(90deg, var(--primary) 0%, var(--primary-2) ${((amount - MIN) / (MAX - MIN)) * 100}%, rgba(255,255,255,0.12) ${((amount - MIN) / (MAX - MIN)) * 100}%)`,
              }}
            />
            <div className="slider-limits">
              <span>R$ {MIN}</span>
              <span>R$ {MAX}</span>
            </div>

            <div className="quick-values">
              {QUICK_VALUES.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={amount === v ? "chip selected" : "chip"}
                  onClick={() => setAmount(v)}
                >
                  R$ {v}
                </button>
              ))}
            </div>
            <p className="value-hint"><Icon name="sparkles" /> Você pode escolher de 5 em 5 reais</p>
          </div>

          <div className="journey-connector" aria-hidden="true"><Icon name="chevron-right" /></div>

          <div className="journey-step journey-confirm">
            <div className="picker-heading">
              <div>
                <span className="picker-step">PASSO 3 DE 3</span>
                <h2>Confirme seu card</h2>
              </div>
              <span className="step-badge">03</span>
            </div>

            <div className="journey-preview">
              <GiftCardVisual amount={amount} platform={platform} floating />
            </div>

            <div className="preview-caption horizontal">
              <span><Icon name="zap" /> Liberação imediata</span>
              <span><Icon name="shield" /> Compra protegida</span>
            </div>

            <div className="order-summary">
              <span><Icon name="gamepad" /> {getPlatform(platform).name}</span>
              <strong>R$ {amount},00</strong>
            </div>

            <button
              type="button"
              className="btn-primary btn-buy"
              onClick={() => setPaying(true)}
            >
              Continuar para pagamento <Icon name="chevron-right" />
            </button>
            <p className="secure-note"><Icon name="lock" /> Seus dados são protegidos</p>
          </div>
        </section>
      </main>

      {paying && (
        <PaymentModal amount={amount} platform={platform} onClose={() => setPaying(false)} />
      )}
    </div>
  );
}
