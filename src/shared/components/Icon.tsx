import type { SVGProps } from "react";

export type IconName =
  | "bag"
  | "bell"
  | "calendar"
  | "check"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "copy"
  | "credit-card"
  | "eye"
  | "eye-off"
  | "gamepad"
  | "home"
  | "help-circle"
  | "key"
  | "lock"
  | "logout"
  | "moon"
  | "pix"
  | "shield"
  | "sparkles"
  | "sun"
  | "user"
  | "zap";

const paths: Record<IconName, React.ReactNode> = {
  bag: <><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
  calendar: <><path d="M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z"/><path d="M8 2v4M16 2v4M3 10h18"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  "chevron-down": <path d="m6 9 6 6 6-6"/>,
  "chevron-left": <path d="m15 18-6-6 6-6"/>,
  "chevron-right": <path d="m9 18 6-6-6-6"/>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></>,
  "credit-card": <><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h3"/></>,
  eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
  "eye-off": <><path d="m3 3 18 18M10.6 6.2A10.6 10.6 0 0 1 12 6c6 0 9.5 6 9.5 6a16.6 16.6 0 0 1-2.1 2.8M6.5 6.7C4 8.3 2.5 12 2.5 12s3.5 6 9.5 6c1.2 0 2.3-.2 3.3-.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/></>,
  gamepad: <><path d="M7 7h10a5 5 0 0 1 4.6 7l-1.1 2.7a2.2 2.2 0 0 1-3.5.8L14.5 15h-5L7 17.5a2.2 2.2 0 0 1-3.5-.8L2.4 14A5 5 0 0 1 7 7Z"/><path d="M7 10v4M5 12h4M16 11h.01M18 13h.01"/></>,
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
  "help-circle": <><circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.5 2.5 0 1 1 3.7 2.2c-.9.5-1.4 1-1.4 2M12 17h.01"/></>,
  key: <><circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M15 8l2 2M17 6l2 2"/></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  logout: <><path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9"/></>,
  moon: <path d="M20.5 14.3A8 8 0 0 1 9.7 3.5 8.5 8.5 0 1 0 20.5 14.3Z"/>,
  pix: <><path d="m12 3 4.2 4.2a2.5 2.5 0 0 0 3.6 0L22 5"/><path d="m12 21-4.2-4.2a2.5 2.5 0 0 0-3.6 0L2 19M3 12l7-7a2.8 2.8 0 0 1 4 0l7 7-7 7a2.8 2.8 0 0 1-4 0l-7-7Z"/></>,
  shield: <><path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
  sparkles: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3ZM5 14l.7 2.3L8 17l-2.3.7L5 20l-.7-2.3L2 17l2.3-.7L5 14ZM19 13l.7 2.3L22 16l-2.3.7L19 19l-.7-2.3L16 16l2.3-.7L19 13Z"/></>,
  sun: <><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  zap: <path d="m13 2-9 12h8l-1 8 9-12h-8l1-8Z"/>,
};

interface Props extends SVGProps<SVGSVGElement> {
  name: IconName;
}

export default function Icon({ name, className = "icon", ...props }: Props) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
