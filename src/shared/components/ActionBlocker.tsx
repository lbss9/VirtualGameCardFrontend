interface ActionBlockerProps {
  active: boolean;
  label?: string;
}

export default function ActionBlocker({ active, label = "Processando sua solicitação…" }: ActionBlockerProps) {
  if (!active) return null;

  return (
    <div className="action-blocker" role="status" aria-live="polite" aria-label={label}>
      <span className="spinner" aria-hidden="true" />
      <strong>{label}</strong>
    </div>
  );
}
