import { request } from "../../../shared/api/client";
import type { PagedResult, Purchase, PurchaseDetail } from "../../../shared/api/types";
import { USE_MOCKS } from "../../../shared/api/config";
import {
  mockGetPurchase,
  mockGetPurchases,
  mockPurchaseCard,
  mockSimulatePurchaseApproval,
} from "../../../shared/api/mock";

const PAYMENT_SERVICE_HEALTH_URL = String(
  import.meta.env.VITE_PAYMENT_SERVICE_HEALTH_URL
    ?? "https://virtualgamecardpaymentservice.onrender.com/healthz",
).trim();

/**
 * Render Free pode "dormir" serviços web. Essa chamada sem leitura de resposta
 * apenas acorda o PaymentService para ele consumir a fila SQS em seguida.
 */
export function wakePaymentProcessor(): void {
  if (!PAYMENT_SERVICE_HEALTH_URL || USE_MOCKS) return;

  void fetch(PAYMENT_SERVICE_HEALTH_URL, {
    method: "GET",
    mode: "no-cors",
    cache: "no-store",
    keepalive: true,
  }).catch(() => {
    // Best effort: a compra continua pendente e o polling tenta novamente depois.
  });
}

/** Cria um pedido pendente; o código só existe após confirmação do provedor. */
export async function purchaseCard(
  amount: number,
  platform: string,
  paymentMethod: string,
): Promise<PurchaseDetail> {
  if (USE_MOCKS) return mockPurchaseCard(amount, platform, paymentMethod);
  const result = await request<PurchaseDetail>("/api/cards/purchase", {
    method: "POST",
    body: { amount, platform, paymentMethod },
    auth: true,
    headers: { "Idempotency-Key": crypto.randomUUID() },
  });

  if (result.status === "pending") wakePaymentProcessor();

  return result;
}

export function getPurchases(
  page: number,
  pageSize: number,
): Promise<PagedResult<Purchase>> {
  if (USE_MOCKS) return mockGetPurchases(page, pageSize);
  return request<PagedResult<Purchase>>(
    `/api/purchases?page=${page}&pageSize=${pageSize}`,
    { auth: true },
  );
}

export function getPurchase(id: string): Promise<PurchaseDetail> {
  if (USE_MOCKS) return mockGetPurchase(id);
  return request<PurchaseDetail>(`/api/purchases/${id}`, { auth: true });
}

export function simulatePurchaseApproval(id: string): Promise<PurchaseDetail> {
  if (USE_MOCKS) return mockSimulatePurchaseApproval(id);
  return request<PurchaseDetail>(`/api/purchases/${id}/simulate-approval`, {
    method: "POST",
    auth: true,
  });
}
