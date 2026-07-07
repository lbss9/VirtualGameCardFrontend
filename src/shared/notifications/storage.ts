export interface AppNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  kind: "purchase" | "security" | "news" | "support";
}

const STORAGE_KEY = "vgc.notifications";
export const NOTIFICATIONS_EVENT = "vgc-notifications-change";

const seed: AppNotification[] = [
  {
    id: "welcome",
    title: "Boas-vindas à VirtualGameCard!",
    message: "Sua conta está pronta. Escolha uma plataforma e encontre seu próximo jogo.",
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    read: false,
    kind: "news",
  },
  {
    id: "security",
    title: "Sua conta está protegida",
    message: "Nunca compartilhe códigos de gift card ou sua senha com outras pessoas.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    read: false,
    kind: "security",
  },
];

function emit(): void {
  window.dispatchEvent(new Event(NOTIFICATIONS_EVENT));
}

export function getNotifications(): AppNotification[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(raw) as AppNotification[];
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

function save(items: AppNotification[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  emit();
}

export function addNotification(item: Omit<AppNotification, "id" | "createdAt" | "read">): void {
  save([
    { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString(), read: false },
    ...getNotifications(),
  ].slice(0, 30));
}

export function markNotificationRead(id: string): void {
  save(getNotifications().map((item) => item.id === id ? { ...item, read: true } : item));
}

export function markAllNotificationsRead(): void {
  save(getNotifications().map((item) => ({ ...item, read: true })));
}

