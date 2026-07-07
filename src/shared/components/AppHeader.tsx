import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearSession, getEmailFromToken } from "../../features/auth/model/storage";
import Icon from "./Icon";
import ThemeToggle from "./ThemeToggle";
import NotificationCenter from "./NotificationCenter";
import { request } from "../api/client";
import { USE_MOCKS } from "../api/config";

/** Header do app logado: marca + menu do usuário (Perfil / Minhas Compras / Sair). */
export default function AppHeader() {
  const navigate = useNavigate();
  const email = getEmailFromToken() ?? "usuário";
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleLogout() {
    try {
      if (!USE_MOCKS) {
        await request<void>("/api/auth/logout", { method: "POST", auth: true });
      }
    } finally {
      clearSession();
      navigate("/", { replace: true });
    }
  }

  return (
    <header className="dash-header">
      <Link to="/painel" className="brand brand-link">
        <span className="brand-logo"><span>V</span></span>
        <span className="brand-name">VirtualGameCard</span>
      </Link>

      <div className="header-actions">
        <ThemeToggle />
        <Link to="/ajuda" className="header-icon-button help-button" aria-label="Ajuda e suporte" title="Ajuda e suporte"><Icon name="help-circle" /></Link>
        <NotificationCenter />
        <div className="user-menu" ref={menuRef}>
        <button
          type="button"
          className={open ? "user-btn open" : "user-btn"}
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <span className="avatar">{email[0]?.toUpperCase() ?? "U"}</span>
          <span className="user-email">{email}</span>
          <Icon name="chevron-down" className={open ? "caret up" : "caret"} />
        </button>

        {open && (
          <nav className="dropdown" aria-label="Menu da conta">
            <Link
              to="/perfil"
              className="dropdown-item"
              onClick={() => setOpen(false)}
            >
              <Icon name="user" /> Perfil
            </Link>
            <Link
              to="/compras"
              className="dropdown-item"
              onClick={() => setOpen(false)}
            >
              <Icon name="bag" /> Minhas Compras
            </Link>
            <Link to="/ajuda" className="dropdown-item" onClick={() => setOpen(false)}>
              <Icon name="help-circle" /> Ajuda e suporte
            </Link>
            <hr className="dropdown-sep" />
            <button
              type="button"
              className="dropdown-item danger"
              onClick={handleLogout}
            >
              <Icon name="logout" /> Sair
            </button>
          </nav>
        )}
        </div>
      </div>
    </header>
  );
}
