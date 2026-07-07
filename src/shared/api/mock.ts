import type {
  AuthResponse,
  ForgotPasswordResponse,
  MeResponse,
  MessageResponse,
  PagedResult,
  Purchase,
  PurchaseDetail,
} from "./types";
import { PLATFORMS } from "../catalog/platforms";

const PURCHASES_KEY = "vgc.mock.purchases";
const EMAIL_KEY = "vgc.mock.email";
const CREATED_AT_KEY = "vgc.mock.createdAt";
const PASSWORD_KEY = "vgc.mock.password";
const EMAIL_VERIFIED_KEY = "vgc.mock.emailVerified";
const MOCK_USER_ID = "8eb248ef-083e-4d85-9f48-7fa65b267d81";

function wait(ms = 420): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function hashMockPassword(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function base64Url(value: object): string {
  return btoa(JSON.stringify(value))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function tokenFor(email: string): string {
  return `${base64Url({ alg: "none", typ: "JWT" })}.${base64Url({
    sub: MOCK_USER_ID,
    email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  })}.demo`;
}

function codeFor(index: number): string {
  const block = (index * 7919 + 137).toString(36).toUpperCase().padStart(4, "0");
  const tail = (index * 3571 + 2026).toString(36).toUpperCase().padStart(4, "0");
  return `VGC-${block}-${tail}-PLAY`;
}

function seedPurchases(): PurchaseDetail[] {
  const values = [25, 50, 100, 15, 250, 75, 30, 150, 10, 200];
  return Array.from({ length: 43 }, (_, index) => ({
    id: `10000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    amount: values[index % values.length],
    platform: PLATFORMS[index % PLATFORMS.length].id,
    paymentMethod: index % 3 === 0 ? "card" : "pix",
    status: "approved" as const,
    code: codeFor(index + 1),
    paymentReference: `mock_pay_${index + 1}`,
    createdAt: new Date(Date.now() - index * 1000 * 60 * 60 * 31).toISOString(),
  }));
}

function readPurchases(): PurchaseDetail[] {
  const raw = localStorage.getItem(PURCHASES_KEY);
  if (raw) {
    try {
      return (JSON.parse(raw) as PurchaseDetail[]).map((purchase, index) => ({
        ...purchase,
        platform: purchase.platform ?? PLATFORMS[index % PLATFORMS.length].id,
        status: purchase.status ?? "approved",
        paymentReference: purchase.paymentReference ?? `mock_legacy_${index}`,
      }));
    } catch {
      localStorage.removeItem(PURCHASES_KEY);
    }
  }
  const seeded = seedPurchases();
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveIdentity(email: string): void {
  localStorage.setItem(EMAIL_KEY, email.toLowerCase());
  if (!localStorage.getItem(CREATED_AT_KEY)) {
    localStorage.setItem(CREATED_AT_KEY, new Date().toISOString());
  }
}

export async function mockAuth(email: string, password?: string): Promise<AuthResponse> {
  await wait(550);
  saveIdentity(email);
  if (!localStorage.getItem(PASSWORD_KEY) && password) localStorage.setItem(PASSWORD_KEY, await hashMockPassword(password));
  readPurchases();
  return { token: tokenFor(email.toLowerCase()), userId: MOCK_USER_ID };
}

export async function mockChangePassword(currentPassword: string, newPassword: string): Promise<MessageResponse> {
  await wait(620);
  const storedValue = localStorage.getItem(PASSWORD_KEY);
  const savedHash = storedValue ? (storedValue.length === 64 ? storedValue : await hashMockPassword(storedValue)) : await hashMockPassword("Senha@123");
  if (await hashMockPassword(currentPassword) !== savedHash) throw new Error("A senha atual está incorreta.");
  localStorage.setItem(PASSWORD_KEY, await hashMockPassword(newPassword));
  return { message: "Senha alterada com sucesso." };
}

export async function mockForgotPassword(): Promise<ForgotPasswordResponse> {
  await wait();
  return {
    message: "Se o e-mail existir, enviamos instruções para redefinir a senha.",
    resetToken: "demo-reset-token",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
}

export async function mockResetPassword(): Promise<MessageResponse> {
  await wait();
  return { message: "Senha redefinida com sucesso. Você já pode entrar." };
}

export async function mockMe(): Promise<MeResponse> {
  await wait(260);
  return {
    userId: MOCK_USER_ID,
    email: localStorage.getItem(EMAIL_KEY) ?? "jogador@virtualcard.dev",
    emailVerified: localStorage.getItem(EMAIL_VERIFIED_KEY) !== "false",
    createdAt: localStorage.getItem(CREATED_AT_KEY) ?? "2026-01-12T14:30:00.000Z",
  };
}

export async function mockSendEmailVerification(): Promise<MessageResponse> {
  await wait(520);
  return { message: "Enviamos um novo link de confirmação para o seu e-mail." };
}

export async function mockSimulateEmailVerification(): Promise<MeResponse> {
  await wait(520);
  localStorage.setItem(EMAIL_VERIFIED_KEY, "true");
  return mockMe();
}

export async function mockPurchaseCard(
  amount: number,
  platform: string,
  paymentMethod: string,
): Promise<PurchaseDetail> {
  await wait(700);
  const purchases = readPurchases();
  const purchase: PurchaseDetail = {
    id: crypto.randomUUID(),
    amount,
    platform,
    paymentMethod,
    status: "pending",
    code: null,
    paymentReference: `mock_pay_${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(PURCHASES_KEY, JSON.stringify([purchase, ...purchases]));
  return purchase;
}

export async function mockSimulatePurchaseApproval(id: string): Promise<PurchaseDetail> {
  await wait(620);
  const purchases = readPurchases();
  const index = purchases.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("Compra não encontrada.");
  const updated: PurchaseDetail = {
    ...purchases[index],
    status: "approved",
    code: purchases[index].code ?? codeFor(index + purchases.length + 31),
  };
  purchases[index] = updated;
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases));
  return updated;
}

export async function mockGetPurchases(
  page: number,
  pageSize: number,
): Promise<PagedResult<Purchase>> {
  await wait(330);
  const purchases = readPurchases();
  const start = (page - 1) * pageSize;
  return {
    items: purchases.slice(start, start + pageSize).map(({ code: _code, ...item }) => item),
    total: purchases.length,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(purchases.length / pageSize)),
  };
}

export async function mockGetPurchase(id: string): Promise<PurchaseDetail> {
  await wait(260);
  const purchase = readPurchases().find((item) => item.id === id);
  if (!purchase) throw new Error("Compra não encontrada.");
  return purchase;
}
