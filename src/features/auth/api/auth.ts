import { request } from "../../../shared/api/client";
import type {
  AuthResponse,
  ForgotPasswordResponse,
  MessageResponse,
} from "../../../shared/api/types";
import { USE_MOCKS } from "../../../shared/api/config";
import { mockAuth, mockChangePassword, mockForgotPassword, mockResetPassword } from "../../../shared/api/mock";

export function register(email: string, password: string): Promise<AuthResponse> {
  if (USE_MOCKS) return mockAuth(email, password);
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: { email, password },
  });
}

export function login(email: string, password: string): Promise<AuthResponse> {
  if (USE_MOCKS) return mockAuth(email, password);
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  if (USE_MOCKS) return mockForgotPassword();
  return request<ForgotPasswordResponse>("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export function resetPassword(
  token: string,
  newPassword: string,
): Promise<MessageResponse> {
  if (USE_MOCKS) return mockResetPassword();
  return request<MessageResponse>("/api/auth/reset-password", {
    method: "POST",
    body: { token, newPassword },
  });
}

export function changePassword(currentPassword: string, newPassword: string): Promise<MessageResponse> {
  if (USE_MOCKS) return mockChangePassword(currentPassword, newPassword);
  return request<MessageResponse>("/api/me/password", {
    method: "POST",
    auth: true,
    body: { currentPassword, newPassword },
  });
}
