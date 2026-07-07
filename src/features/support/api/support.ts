import { USE_MOCKS } from "../../../shared/api/config";
import { request } from "../../../shared/api/client";

export interface SupportTicketRequest {
  subject: string;
  category: string;
  message: string;
}

export interface SupportTicketResponse {
  id: string;
  status: "open";
  createdAt: string;
}

export async function createSupportTicket(body: SupportTicketRequest): Promise<SupportTicketResponse> {
  if (USE_MOCKS) {
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    return { id: crypto.randomUUID(), status: "open", createdAt: new Date().toISOString() };
  }
  return request<SupportTicketResponse>("/api/support/tickets", { method: "POST", body, auth: true });
}
