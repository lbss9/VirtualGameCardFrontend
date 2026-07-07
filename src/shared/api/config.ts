/**
 * Permite desenvolver e revisar toda a experiência antes de a API estar pronta.
 * Em produção os mocks nunca são habilitados, mesmo que a variável seja definida.
 */
export const USE_MOCKS =
  import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === "true";

