const ORDER_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: 'Pago pendiente',
  PAID: 'Pagado',
  REJECTED: 'Rechazado',
  REFUNDED: 'Reembolsado',
};

const SUCCESS = new Set(['PAID', 'DELIVERED']);
const DANGER = new Set(['CANCELLED', 'REJECTED']);

export function StatusBadge({ kind = 'order', value }: { kind?: 'order' | 'payment'; value: string }) {
  const labels = kind === 'order' ? ORDER_LABELS : PAYMENT_LABELS;
  const label = labels[value] ?? value;
  const tone = SUCCESS.has(value)
    ? 'border-black bg-black text-white'
    : DANGER.has(value)
      ? 'border-red-700/30 bg-red-50 text-red-700'
      : 'border-line bg-white text-ink';

  return (
    <span className={`inline-flex items-center border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${tone}`}>
      {label}
    </span>
  );
}
