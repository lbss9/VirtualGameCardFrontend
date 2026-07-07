import { request } from "../../../shared/api/client";
import type { PagedResult, Purchase, PurchaseDetail } from "../../../shared/api/types";
import { USE_MOCKS } from "../../../shared/api/config";
import {
  mockGetPurchase,
  mockGetPurchases,
  mockPurchaseCard,
} from "../../../shared/api/mock";

/** Cria um pedido pendente; o código só existe após confirmação do provedor. */
export function purchaseCard(
  amount: number,
  platform: string,
  paymentMethod: string,
): Promise<PurchaseDetail> {
  if (USE_MOCKS) return mockPurchaseCard(amount, platform, paymentMethod);
  return request<PurchaseDetail>("/api/cards/purchase", {
    method: "POST",
    body: { amount, platform, paymentMethod },
    auth: true,
    headers: { "Idempotency-Key": crypto.randomUUID() },
  });
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
