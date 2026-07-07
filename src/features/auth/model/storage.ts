const TOKEN_KEY = "vgc.token";
const USER_ID_KEY = "vgc.userId";

export function saveSession(token: string, userId: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_ID_KEY, userId);
}

export function clearSession(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_ID_KEY);
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

/** Lê apenas dado de apresentação. Autorização nunca depende deste payload não verificado. */
export function getEmailFromToken(): string | null {
  const token = getToken();
  if (!token) return null;
  try {
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload || encodedPayload.length > 8192) return null;
    const normalized = encodedPayload.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(encodedPayload.length / 4) * 4, "=");
    const payload: unknown = JSON.parse(atob(normalized));
    if (!payload || typeof payload !== "object") return null;
    return "email" in payload && typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}
