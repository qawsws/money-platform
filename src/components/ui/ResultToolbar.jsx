import Card from './Card';

export default function ResultToolbar({ count, query, label = '\uCD1D', emptyLabel = '\uD604\uC7AC \uB370\uC774\uD130 \uAE30\uC900' }) {
  const hasQuery = Boolean(query?.trim());

  return (
    <Card hover={false} className="mb-5 flex min-h-14 flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-bold text-[var(--color-text-primary)]">
        {hasQuery ? '\uAC80\uC0C9 \uACB0\uACFC' : label} <span className="text-[var(--color-primary)]">{count}{'\uAC1C'}</span>
      </p>
      <p className="min-w-0 truncate text-sm text-[var(--color-text-secondary)]">
        {hasQuery ? <><span className="font-semibold text-[var(--color-text-primary)]">{query}</span>{' \uAE30\uC900'}</> : emptyLabel}
      </p>
    </Card>
  );
}
