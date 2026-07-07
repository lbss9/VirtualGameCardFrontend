import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_EVENT,
  type AppNotification,
} from "../notifications/storage";

function relativeTime(iso: string): string {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  return `há ${Math.floor(hours / 24)} d`;
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>(getNotifications);
  const ref = useRef<HTMLDivElement>(null);
  const unread = items.filter((item) => !item.read).length;

  useEffect(() => {
    const sync = () => setItems(getNotifications());
    window.addEventListener(NOTIFICATIONS_EVENT, sync);
    return () => window.removeEventListener(NOTIFICATIONS_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function markOne(id: string) {
    markNotificationRead(id);
  }

  return (
    <div className="notification-center" ref={ref}>
      <button type="button" className="header-icon-button" onClick={() => setOpen((value) => !value)} aria-label={`Notificações${unread ? `, ${unread} não lidas` : ""}`} aria-expanded={open}>
        <Icon name="bell" />
        {unread > 0 && <span className="notification-count">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <section className="notification-panel" aria-label="Central de notificações">
          <header>
            <div><span className="eyebrow">Central</span><h2>Notificações</h2></div>
            {unread > 0 && <button type="button" onClick={markAllNotificationsRead}>Marcar todas como lidas</button>}
          </header>
          <div className="notification-list">
            {items.length === 0 ? (
              <div className="notification-empty"><Icon name="bell" /><p>Tudo tranquilo por aqui.</p></div>
            ) : items.map((item) => (
              <button key={item.id} type="button" className={item.read ? "notification-item" : "notification-item unread"} onClick={() => markOne(item.id)}>
                <span className={`notification-kind ${item.kind}`}><Icon name={item.kind === "purchase" ? "bag" : item.kind === "security" ? "shield" : item.kind === "support" ? "help-circle" : "sparkles"} /></span>
                <span><strong>{item.title}</strong><p>{item.message}</p><small>{relativeTime(item.createdAt)}</small></span>
                {!item.read && <i aria-label="Não lida" />}
              </button>
            ))}
          </div>
          <Link to="/ajuda" onClick={() => setOpen(false)}>Precisa de ajuda? Fale com o suporte <Icon name="chevron-right" /></Link>
        </section>
      )}
    </div>
  );
}
