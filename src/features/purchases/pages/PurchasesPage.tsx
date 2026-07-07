import { useCallback, useEffect, useRef, useState } from "react";
import { getPurchase, getPurchases, simulatePurchaseApproval, wakePaymentProcessor } from "../api/purchases";
import {
  ApiRequestError,
  type PagedResult,
  type Purchase,
  type PurchaseDetail,
} from "../../../shared/api/types";
import AppHeader from "../../../shared/components/AppHeader";
import GiftCardVisual from "../components/GiftCardVisual";
import Icon from "../../../shared/components/Icon";
import { getPlatform } from "../../../shared/catalog/platforms";
import { useEscapeKey } from "../../../shared/hooks/useEscapeKey";
import { useBodyScrollLock } from "../../../shared/hooks/useBodyScrollLock";
import ActionBlocker from "../../../shared/components/ActionBlocker";
import { addNotification } from "../../../shared/notifications/storage";

const PAGE_SIZES = [20, 50, 100];
const PENDING_PURCHASE_POLL_MS = 5000;
const PENDING_PURCHASE_ESTIMATE_SECONDS = 30;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const METHOD_LABEL: Record<string, string> = { pix: "PIX", card: "Cartão" };

type PurchaseStatus = Purchase["status"];

const STATUS_VIEW: Record<PurchaseStatus, { label: string; short: string; detail: string; tone: string }> = {
  pending: {
    label: "Pendente",
    short: "Pendente",
    detail: "Aguardando confirmação do pagamento",
    tone: "pending",
  },
  approved: {
    label: "Aprovado",
    short: "Disponível",
    detail: "Card disponível para resgate",
    tone: "approved",
  },
  failed: {
    label: "Falhou",
    short: "Falhou",
    detail: "Pagamento não aprovado",
    tone: "failed",
  },
  canceled: {
    label: "Cancelado",
    short: "Cancelado",
    detail: "Pedido cancelado",
    tone: "canceled",
  },
};

function Method({ value }: { value: string }) {
  const isPix = value === "pix";
  return <span className="method-pill"><Icon name={isPix ? "pix" : "credit-card"} /> {METHOD_LABEL[value] ?? value}</span>;
}

function formatSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function getPendingEstimate(createdAt: string, now: number) {
  const availableAt = new Date(createdAt).getTime() + PENDING_PURCHASE_ESTIMATE_SECONDS * 1000;
  const secondsLeft = Math.max(0, Math.ceil((availableAt - now) / 1000));
  const elapsed = PENDING_PURCHASE_ESTIMATE_SECONDS - secondsLeft;
  const progress = Math.min(100, Math.max(0, (elapsed / PENDING_PURCHASE_ESTIMATE_SECONDS) * 100));

  return {
    secondsLeft,
    progress,
    done: secondsLeft === 0,
  };
}

const REDEEM_STEPS: Record<string, [string, string, string]> = {
  steam: ["Abra a Steam e acesse sua conta", "Entre em Jogos › Ativar um produto", "Cole o código e confirme a ativação"],
  playstation: ["Abra a PlayStation Store", "Selecione Resgatar código no menu", "Digite o código e confirme o crédito"],
  xbox: ["Abra a Microsoft Store ou o Xbox", "Acesse Resgatar um código", "Cole o código e confirme na sua conta"],
  nintendo: ["Abra a Nintendo eShop", "Selecione Inserir código", "Digite o código e adicione os fundos"],
  "google-play": ["Abra a Google Play Store", "Acesse Pagamentos › Resgatar código", "Cole o código e confirme o saldo"],
  roblox: ["Acesse roblox.com/redeem", "Entre na sua conta Roblox", "Insira o código e clique em Resgatar"],
};

function PendingReleaseMeter({
  purchase,
  now,
  compact = false,
}: {
  purchase: Purchase;
  now: number;
  compact?: boolean;
}) {
  const estimate = getPendingEstimate(purchase.createdAt, now);

  return (
    <span className={compact ? "pending-release-meter compact" : "pending-release-meter"}>
      <span>
        <Icon name="zap" />
        {estimate.done
          ? "Finalizando confirmação..."
          : `Disponível em ${formatSeconds(estimate.secondsLeft)}`}
      </span>
      <i aria-hidden="true"><b style={{ width: `${estimate.progress}%` }} /></i>
    </span>
  );
}

function PendingAvailabilityNotice({
  purchase,
  now,
}: {
  purchase: Purchase;
  now: number;
}) {
  const estimate = getPendingEstimate(purchase.createdAt, now);

  return (
    <div className="pending-availability-notice" role="status" aria-live="polite">
      <span><Icon name="zap" /></span>
      <div>
        <strong>
          {estimate.done
            ? "Estamos finalizando a confirmação"
            : `Aguarde ${formatSeconds(estimate.secondsLeft)} para liberar o gift card`}
        </strong>
        <p>
          {estimate.done
            ? "O tempo estimado terminou. Assim que o provedor confirmar, este modal atualiza sozinho."
            : "A confirmação costuma levar até 30 segundos. Pode deixar esta tela aberta: o status muda em tempo real."}
        </p>
        <i aria-hidden="true"><b style={{ width: `${estimate.progress}%` }} /></i>
      </div>
    </div>
  );
}

function PurchaseTile({ purchase, onOpen, index, now }: { purchase: Purchase; onOpen: () => void; index: number; now: number }) {
  const platform = getPlatform(purchase.platform);
  const status = STATUS_VIEW[purchase.status];
  return (
    <li style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}>
      <button type="button" className="purchase-tile" data-platform={platform.id} data-status={status.tone} onClick={onOpen}>
        <span className="purchase-art">
          <i className="purchase-art-glow" />
          <span className="purchase-art-top">
            <i className="platform-logo"><img src={platform.logo} alt="" /></i>
            <strong>{platform.shortName}</strong>
            <em className={`purchase-status-pill status-${status.tone}`}><span /> {status.short}</em>
          </span>
          <span className="purchase-art-value"><small>R$</small>{purchase.amount}</span>
          {purchase.status === "pending" && <PendingReleaseMeter purchase={purchase} now={now} compact />}
          <span className="purchase-art-bottom">
            <span>•••• •••• ••••</span>
            <b>VIRTUAL CARD</b>
          </span>
        </span>
        <span className="purchase-tile-info">
          <span>
            <strong>{platform.name}</strong>
            <small>{formatDate(purchase.createdAt)}</small>
          </span>
          <Method value={purchase.paymentMethod} />
          <Icon name="chevron-right" />
        </span>
      </button>
    </li>
  );
}

function PurchaseApprovalToast({
  purchase,
  onClose,
}: {
  purchase: Purchase;
  onClose: () => void;
}) {
  const platform = getPlatform(purchase.platform);

  return (
    <aside className="purchase-approval-toast rise" role="status" aria-live="polite">
      <button type="button" onClick={onClose} aria-label="Fechar notificação">×</button>
      <span className="toast-icon"><Icon name="sparkles" /></span>
      <div>
        <strong>{platform.shortName} Card aprovado!</strong>
        <p>Seu card de R$ {purchase.amount},00 já está disponível em Minhas Compras.</p>
      </div>
    </aside>
  );
}

export default function PurchasesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [data, setData] = useState<PagedResult<Purchase> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<PurchaseDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [approvalToast, setApprovalToast] = useState<Purchase | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const detailRequest = useRef(0);
  const pollingInFlight = useRef(false);
  const notifiedApprovals = useRef(new Set<string>());
  const processorWakeups = useRef(new Set<string>());
  const approvalToastTimer = useRef<number | null>(null);

  const load = useCallback(async (p: number, ps: number) => {
    setLoading(true);
    setError(null);
    try {
      setData(await getPurchases(p, ps));
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Erro ao carregar compras.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, pageSize);
  }, [page, pageSize, load]);

  const hasPendingPurchase =
    (data?.items.some((item) => item.status === "pending") ?? false)
    || selected?.status === "pending";

  useEffect(() => {
    if (!hasPendingPurchase) return;

    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [hasPendingPurchase]);

  const notifyApproval = useCallback((purchase: Purchase) => {
    if (notifiedApprovals.current.has(purchase.id)) return;

    notifiedApprovals.current.add(purchase.id);
    const platform = getPlatform(purchase.platform);

    addNotification({
      kind: "purchase",
      title: `${platform.shortName} Card aprovado`,
      message: `Seu card de R$ ${purchase.amount},00 já está disponível para resgate.`,
    });

    setApprovalToast(purchase);
    if (approvalToastTimer.current) window.clearTimeout(approvalToastTimer.current);
    approvalToastTimer.current = window.setTimeout(() => {
      setApprovalToast((current) => current?.id === purchase.id ? null : current);
    }, 6500);
  }, []);

  useEffect(() => {
    return () => {
      if (approvalToastTimer.current) window.clearTimeout(approvalToastTimer.current);
    };
  }, []);

  useEffect(() => {
    const pendingPurchases = data?.items.filter((item) => item.status === "pending") ?? [];
    const pendingIds = new Set(pendingPurchases.map((purchase) => purchase.id));
    const watchedPurchases = selected?.status === "pending" && !pendingIds.has(selected.id)
      ? [...pendingPurchases, selected]
      : pendingPurchases;
    if (watchedPurchases.length === 0) return;

    const hasPurchaseWaitingForWakeup = watchedPurchases.some((purchase) => {
      if (processorWakeups.current.has(purchase.id)) return false;
      processorWakeups.current.add(purchase.id);
      return true;
    });

    if (hasPurchaseWaitingForWakeup) wakePaymentProcessor();

    let active = true;

    async function refreshPendingPurchases() {
      if (!active || pollingInFlight.current || document.visibilityState === "hidden") return;
      pollingInFlight.current = true;

      try {
        const details = await Promise.all(
          watchedPurchases.map(async (purchase) => {
            try {
              return await getPurchase(purchase.id);
            } catch {
              return null;
            }
          }),
        );

        if (!active) return;

        const approvedPurchases = details.filter(
          (purchase): purchase is PurchaseDetail => purchase?.status === "approved",
        );

        if (approvedPurchases.length === 0) return;

        setData((current) => {
          if (!current) return current;

          return {
            ...current,
            items: current.items.map((item) => {
              const approved = approvedPurchases.find((purchase) => purchase.id === item.id);
              return approved ? { ...item, status: approved.status } : item;
            }),
          };
        });

        setSelected((current) => {
          if (!current) return current;
          const approved = approvedPurchases.find((purchase) => purchase.id === current.id);
          return approved ? approved : current;
        });

        approvedPurchases.forEach(notifyApproval);
      } finally {
        pollingInFlight.current = false;
      }
    }

    const intervalId = window.setInterval(refreshPendingPurchases, PENDING_PURCHASE_POLL_MS);
    void refreshPendingPurchases();

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [data?.items, notifyApproval, selected]);

  function changePageSize(size: number) {
    setPageSize(size);
    setPage(1);
  }

  async function openDetail(id: string) {
    const requestId = ++detailRequest.current;
    setDetailOpen(true);
    setDetailLoading(true);
    setShowCode(false);
    setCopied(false);
    setSimulationError(null);
    try {
      const result = await getPurchase(id);
      if (detailRequest.current === requestId) setSelected(result);
    } catch (err) {
      if (detailRequest.current === requestId) {
        setError(err instanceof ApiRequestError ? err.message : "Erro ao carregar detalhe.");
        setDetailOpen(false);
      }
    } finally {
      if (detailRequest.current === requestId) setDetailLoading(false);
    }
  }

  const closeDetail = useCallback(() => {
    detailRequest.current += 1;
    if (simulationLoading) return;
    setDetailOpen(false);
    setDetailLoading(false);
    setSelected(null);
  }, [simulationLoading]);

  useEscapeKey({ enabled: detailOpen && !simulationLoading, onEscape: closeDetail });
  useBodyScrollLock(detailOpen);

  async function handleCopy() {
    if (!selected?.code) return;
    await navigator.clipboard.writeText(selected.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function handleSimulateApproval() {
    if (!selected || selected.status !== "pending" || simulationLoading) return;
    setSimulationLoading(true);
    setSimulationError(null);
    try {
      const approved = await simulatePurchaseApproval(selected.id);
      setSelected(approved);
      setShowCode(false);
      setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === approved.id
                  ? { ...item, status: approved.status }
                  : item,
              ),
            }
          : current,
      );
    } catch (err) {
      setSimulationError(
        err instanceof ApiRequestError
          ? err.message
          : "Não foi possível confirmar o pagamento agora.",
      );
    } finally {
      setSimulationLoading(false);
    }
  }

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="dashboard">
      <div className="bg-grid" aria-hidden="true" />
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />

      <AppHeader />
      {approvalToast && (
        <PurchaseApprovalToast
          purchase={approvalToast}
          onClose={() => setApprovalToast(null)}
        />
      )}

      <main className="purchases">
        <div className="purchases-head rise">
          <div>
            <span className="eyebrow"><Icon name="bag" /> Sua biblioteca</span>
            <h1 className="store-title">Minhas Compras</h1>
            <p className="store-sub">Todos os seus cards, códigos e detalhes em um só lugar.</p>
          </div>
          <label className="page-size">
            Por página:
            <select
              value={pageSize}
              onChange={(e) => changePageSize(Number(e.target.value))}
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <p className="error shake" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <div className="purchases-loading">
            <span className="spinner big" aria-label="Carregando" />
          </div>
        ) : data && data.items.length === 0 ? (
          <div className="empty-state rise">
            <span className="empty-icon"><Icon name="gamepad" /></span>
            <p>Você ainda não tem compras.</p>
            <p className="modal-sub">Compre seu primeiro Game Card na loja!</p>
          </div>
        ) : (
          <>
            <ul className="purchase-gallery">
              {data?.items.map((p, i) => (
                <PurchaseTile key={p.id} purchase={p} index={i} now={now} onOpen={() => openDetail(p.id)} />
              ))}
            </ul>

            <nav className="pagination" aria-label="Paginação">
              <button
                type="button"
                className="btn-ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <Icon name="chevron-left" /> Anterior
              </button>
              <span className="page-info">
                Página <strong>{page}</strong> de <strong>{totalPages}</strong>
                <small> · {data?.total ?? 0} compras</small>
              </span>
              <button
                type="button"
                className="btn-ghost"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima <Icon name="chevron-right" />
              </button>
            </nav>
          </>
        )}
      </main>

      {/* ===== Detalhe da compra ===== */}
      {detailOpen && (
        <div
          className="overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !simulationLoading) closeDetail();
          }}
        >
          <div className={simulationLoading ? "modal purchase-detail-modal rise is-action-busy" : "modal purchase-detail-modal rise"} role="dialog" aria-modal="true" aria-labelledby="purchase-detail-title" aria-busy={simulationLoading}>
            {detailLoading || !selected ? (
              <div className="purchases-loading">
                <span className="spinner big" aria-label="Carregando" />
              </div>
            ) : (
              <>
                <button className="modal-close detail-close" type="button" onClick={closeDetail} aria-label="Fechar" disabled={simulationLoading}>×</button>
                <div className="purchase-detail-layout">
                  <section className="detail-showcase" data-platform={selected.platform} data-status={STATUS_VIEW[selected.status].tone}>
                    <span className="platform-detail" data-platform={selected.platform}>
                      <i><img src={getPlatform(selected.platform).logo} alt="" /></i> {getPlatform(selected.platform).name}
                    </span>
                    <div className="detail-card-stage">
                      <GiftCardVisual
                        amount={selected.amount}
                        platform={selected.platform}
                        size="lg"
                        code={showCode ? selected.code ?? undefined : "•••• •••• ••••"}
                      />
                    </div>
                    <span className={`detail-status status-${STATUS_VIEW[selected.status].tone}`}><i /> {STATUS_VIEW[selected.status].detail}</span>
                    <p>Comprado em {formatDate(selected.createdAt)}</p>
                  </section>

                  <section className="detail-content">
                    <span className="eyebrow"><Icon name="sparkles" /> Detalhes da compra</span>
                    <h2 className="modal-title" id="purchase-detail-title">Seu {getPlatform(selected.platform).shortName} Card</h2>
                    <p className="detail-intro">{selected.status === "approved" ? "O crédito está pronto. Revele o código somente quando estiver no ambiente oficial da plataforma." : selected.status === "pending" ? "O código será emitido somente após a confirmação segura do provedor de pagamento." : "Este pedido não possui código disponível para resgate."}</p>

                    {selected.status === "pending" && <PendingAvailabilityNotice purchase={selected} now={now} />}

                    <dl className="purchase-facts">
                      <div><dt>Valor</dt><dd>R$ {selected.amount},00</dd></div>
                      <div><dt>Pagamento</dt><dd><Method value={selected.paymentMethod} /></dd></div>
                      <div><dt>Status</dt><dd className={`status-badge status-${STATUS_VIEW[selected.status].tone}`}><i /> {STATUS_VIEW[selected.status].label}</dd></div>
                    </dl>

                    {selected.code && <div className="code-vault">
                      <div className="code-vault-head">
                        <span><Icon name="key" /> Código de resgate</span>
                        <small>Uso único</small>
                      </div>
                      <div className={showCode ? "vault-value revealed" : "vault-value"}>
                        <code>{showCode ? selected.code : "••••-••••-••••-••••"}</code>
                        <button type="button" onClick={() => setShowCode((value) => !value)} aria-label={showCode ? "Ocultar código" : "Mostrar código"}>
                          <Icon name={showCode ? "eye-off" : "eye"} />
                        </button>
                        <button type="button" onClick={handleCopy} aria-label="Copiar código">
                          <Icon name={copied ? "check" : "copy"} />
                        </button>
                      </div>
                      <p><Icon name="shield" /> Não compartilhe este código com outras pessoas.</p>
                    </div>}

                    <div className="redeem-guide">
                      <h3>Como resgatar</h3>
                      <ol>
                        {(REDEEM_STEPS[selected.platform] ?? REDEEM_STEPS.steam).map((step, index) => (
                          <li key={step}><span>{index + 1}</span><p>{step}</p></li>
                        ))}
                      </ol>
                    </div>

                    <div className="detail-footer">
                      <span>Pedido <code>#{selected.id.slice(0, 8).toUpperCase()}</code></span>
                      {selected.status === "pending" && <button type="button" className="btn-secondary simulate-payment-button" onClick={handleSimulateApproval} disabled={simulationLoading}>
                        <Icon name="zap" /> Simular confirmação
                      </button>}
                      {selected.code && <button type="button" className="btn-primary detail-copy" onClick={handleCopy} disabled={simulationLoading}>
                        <Icon name={copied ? "check" : "copy"} /> {copied ? "Código copiado" : "Copiar código"}
                      </button>}
                    </div>
                    {simulationError && <p className="purchase-simulation-error shake" role="alert">{simulationError}</p>}
                  </section>
                </div>
                <ActionBlocker active={simulationLoading} label="Confirmando pagamento…" />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
