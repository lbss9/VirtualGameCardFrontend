import { request } from "../../../shared/api/client";
import type { MeResponse, MessageResponse } from "../../../shared/api/types";
import { USE_MOCKS } from "../../../shared/api/config";
import { mockMe, mockSendEmailVerification, mockSimulateEmailVerification } from "../../../shared/api/mock";

export function getMe(): Promise<MeResponse> {
  if (USE_MOCKS) return mockMe();
  return request<MeResponse>("/api/me", { auth: true });
}

export function sendEmailVerification(): Promise<MessageResponse> {
  if (USE_MOCKS) return mockSendEmailVerification();
  return request<MessageResponse>("/api/me/email-verification", { method: "POST", auth: true });
}

export function simulateEmailVerification(): Promise<MeResponse> {
  if (USE_MOCKS) return mockSimulateEmailVerification();
  return request<MeResponse>("/api/me/email-verification/simulate-confirm", { method: "POST", auth: true });
}
