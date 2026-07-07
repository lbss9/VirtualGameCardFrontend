import { useEffect } from "react";

/** Bloqueia o scroll do documento enquanto um modal está ativo e restaura ao desmontar. */
export function useBodyScrollLock(enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [enabled]);
}
