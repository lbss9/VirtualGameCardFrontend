import { clearSession, getToken, saveSession } from "../../features/auth/model/storage";
import { ApiRequestError, type ApiError, type ApiResponse, type AuthResponse } from "./types";

const configuredApiUrl = String(import.meta.env.VITE_API_URL ?? "").trim();
const BASE_URL = (configuredApiUrl || "http://localhost:8090").replace(/\/$/, "");

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  /** Anexa Authorization: Bearer e trata 401 expulsando para o login. */
  auth?: boolean;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  return executeRequest<T>(path, options, true);
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  refreshPromise ??= fetch(`${BASE_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  }).then(async (response) => {
    if (!response.ok) return false;
    const envelope = (await response.json()) as ApiResponse<AuthResponse>;
    if (!envelope.data) return false;
    saveSession(envelope.data.token, envelope.data.userId);
    return true;
  }).catch(() => false).finally(() => { refreshPromise = null; });
  return refreshPromise;
}

async function executeRequest<T>(
  path: string,
  { method = "GET", body, auth = false, headers: customHeaders = {} }: RequestOptions,
  allowRefresh: boolean,
): Promise<T> {
  const headers: Record<string, string> = { ...customHeaders };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiRequestError({
      message: "Não foi possível conectar ao servidor. Tente novamente.",
      code: "NETWORK_ERROR",
      statusCode: 0,
      path,
      data: null,
    });
  }

  if (auth && response.status === 401) {
    if (allowRefresh && await refreshSession()) {
      return executeRequest<T>(path, { method, body, auth, headers: customHeaders }, false);
    }
    clearSession();
    window.location.href = import.meta.env.BASE_URL;
    throw new ApiRequestError({
      message: "Sessão expirada. Entre novamente.",
      code: "UNAUTHORIZED",
      statusCode: 401,
      path,
      data: null,
    });
  }

  if (!response.ok) {
    let apiError: ApiError;
    try {
      apiError = (await response.json()) as ApiError;
    } catch {
      apiError = {
        message: "Ocorreu um erro inesperado.",
        code: "UNKNOWN_ERROR",
        statusCode: response.status,
        path,
        data: null,
      };
    }
    throw new ApiRequestError(apiError);
  }

  if (response.status === 204) return undefined as T;

  const envelope = (await response.json()) as ApiResponse<T>;
  if (envelope.data === null) {
    throw new ApiRequestError({
      message: envelope.message || "A API retornou uma resposta sem dados.",
      code: envelope.code || "EMPTY_RESPONSE_DATA",
      path: envelope.path || path,
      statusCode: envelope.statusCode || response.status,
      data: null,
    });
  }
  return envelope.data;
}
