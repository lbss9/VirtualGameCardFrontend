import { useEffect } from "react";

interface EscapeKeyOptions {
  enabled?: boolean;
  mode?: "close" | "block";
  onEscape?: () => void;
}

/** Centraliza o comportamento de ESC e garante cleanup do listener global. */
export function useEscapeKey({ enabled = true, mode = "close", onEscape }: EscapeKeyOptions): void {
  useEffect(() => {
    if (!enabled) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (mode === "block") {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      onEscape?.();
    };
    document.addEventListener("keydown", handleEscape, mode === "block");
    return () => document.removeEventListener("keydown", handleEscape, mode === "block");
  }, [enabled, mode, onEscape]);
}
