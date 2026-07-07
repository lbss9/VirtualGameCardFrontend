/** Envelope padronizado retornado pela API em sucesso e erro. */
export interface ApiResponse<T> {
  message: string;
  code: string;
  path: string;
  statusCode: number;
  data: T | null;
}

export type ApiError = ApiResponse<never>;

/** Resposta de POST /api/auth/register e /api/auth/login. */
export interface AuthResponse {
  token: string;
  userId: string;
}

/** Resposta de POST /api/auth/forgot-password (resetToken só vem em dev). */
export interface ForgotPasswordResponse {
  message: string;
  resetToken: string | null;
  expiresAt: string | null;
}

/** Resposta de POST /api/auth/reset-password. */
export interface MessageResponse {
  message: string;
}

/** Item da lista de compras (sem o código — ele só vem no detalhe). */
export interface Purchase {
  id: string;
  amount: number;
  platform: string;
  paymentMethod: string;
  status: "pending" | "approved" | "failed" | "canceled";
  createdAt: string;
}

/** Detalhe completo de uma compra, incluindo o código do gift card. */
export interface PurchaseDetail extends Purchase {
  code: string | null;
  paymentReference: string;
}

/** Resultado paginado genérico. */
export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Resposta de GET /api/me. */
export interface MeResponse {
  userId: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

/** Erro lançado pelo client quando a API responde com o contrato ApiError. */
export class ApiRequestError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly path: string;

  constructor(error: ApiError) {
    super(error.message);
    this.name = "ApiRequestError";
    this.code = error.code;
    this.statusCode = error.statusCode;
    this.path = error.path;
  }
}
