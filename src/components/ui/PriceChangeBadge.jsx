const parseChange = (change) => Number.parseFloat(String(change ?? '').replace('%', '').replace('+', ''));

export default function PriceChangeBadge({ change, isPositive, className = '' }) {
  const value = parseChange(change);
  const neutral = !Number.isFinite(value) || value === 0;
  const positive = !neutral && (typeof isPositive === 'boolean' ? isPositive : value > 0);
  const label = neutral ? '보합' : positive ? '상승' : '하락';
  const display = change == null || Number.isNaN(value) ? '-' : String(change);
  const tone = neutral
    ? 'bg-slate-100 text-slate-500'
    : positive
      ? 'bg-[var(--color-positive-soft)] text-[var(--color-positive)]'
      : 'bg-[var(--color-negative-soft)] text-[var(--color-negative)]';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold ${tone} ${className}`}>
      {label} {display}
    </span>
  );
}
