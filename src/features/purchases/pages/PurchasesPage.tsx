import { useCallback, useEffect, useRef, useState } from "react";
import { getPurchase, getPurchases } from "../api/purchases";
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

const PAGE_SIZES = [20, 50, 100];

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

function Method({ value }: { value: string }) {
  const isPix = value === "pix";
  return <span className="method-pill"><Icon name={isPix ? "pix" : "credit-card"} /> {METHOD_LABEL[value] ?? value}</span>;
}

const REDEEM_STEPS: Record<string, [string, string, string]> = {
  steam: ["Abra a Steam e acesse sua conta", "Entre em Jogos › Ativar um produto", "Cole o código e confirme a ativação"],
  playstation: ["Abra a PlayStation Store", "Selecione Resgatar código no menu", "Digite o código e confirme o crédito"],
  xbox: ["Abra a Microsoft Store ou o Xbox", "Acesse Resgatar um código", "Cole o código e confirme na sua conta"],
  nintendo: ["Abra a Nintendo eShop", "Selecione Inserir código", "Digite o código e adicione os fundos"],
  "google-play": ["Abra a Google Play Store", "Acesse Pagamentos › Resgatar código", "Cole o código e confirme o saldo"],
  roblox: ["Acesse roblox.com/redeem", "Entre na sua conta Roblox", "Insira o código e clique em Resgatar"],
};

function PurchaseTile({ purchase, onOpen, index }: { purchase: Purchase; onOpen: () => void; index: number }) {
  const platform = getPlatform(purchase.platform);
  return (
    <li style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}>
      <button type="button" className="purchase-tile" data-platform={platform.id} onClick={onOpen}>
        <span className="purchase-art">
          <i className="purchase-art-glow" />
          <span className="purchase-art-top">
            <i className="platform-logo"><img src={platform.logo} alt="" /></i>
            <strong>{platform.shortName}</strong>
            <em><span /> Disponível</em>
          </span>
          <span className="purchase-art-value"><small>R$</small>{purchase.amount}</span>
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
  const detailRequest = useRef(0);

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
    setDetailOpen(false);
    setDetailLoading(false);
    setSelected(null);
  }, []);

  useEscapeKey({ enabled: detailOpen, onEscape: closeDetail });
  useBodyScrollLock(detailOpen);

  async function handleCopy() {
    if (!selected?.code) return;
    await navigator.clipboard.writeText(selected.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="dashboard">
      <div className="bg-grid" aria-hidden="true" />
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />

      <AppHeader />

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
                <PurchaseTile key={p.id} purchase={p} index={i} onOpen={() => openDetail(p.id)} />
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
        <div className="overlay">
          <div className="modal purchase-detail-modal rise" role="dialog" aria-modal="true" aria-labelledby="purchase-detail-title">
            {detailLoading || !selected ? (
              <div className="purchases-loading">
                <span className="spinner big" aria-label="Carregando" />
              </div>
            ) : (
              <>
                <button className="modal-close detail-close" type="button" onClick={closeDetail} aria-label="Fechar">×</button>
                <div className="purchase-detail-layout">
                  <section className="detail-showcase" data-platform={selected.platform}>
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
                    <span className="detail-status"><i /> {selected.status === "approved" ? "Card disponível para resgate" : "Aguardando confirmação do pagamento"}</span>
                    <p>Comprado em {formatDate(selected.createdAt)}</p>
                  </section>

                  <section className="detail-content">
                    <span className="eyebrow"><Icon name="sparkles" /> Detalhes da compra</span>
                    <h2 className="modal-title" id="purchase-detail-title">Seu {getPlatform(selected.platform).shortName} Card</h2>
                    <p className="detail-intro">{selected.status === "approved" ? "O crédito está pronto. Revele o código somente quando estiver no ambiente oficial da plataforma." : "O código será emitido somente após a confirmação segura do provedor de pagamento."}</p>

                    <dl className="purchase-facts">
                      <div><dt>Valor</dt><dd>R$ {selected.amount},00</dd></div>
                      <div><dt>Pagamento</dt><dd><Method value={selected.paymentMethod} /></dd></div>
                      <div><dt>Status</dt><dd className="status-approved"><Icon name="check" /> {selected.status === "approved" ? "Aprovado" : "Pendente"}</dd></div>
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
                      {selected.code && <button type="button" className="btn-primary detail-copy" onClick={handleCopy}>
                        <Icon name={copied ? "check" : "copy"} /> {copied ? "Código copiado" : "Copiar código"}
                      </button>}
                    </div>
                  </section>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
