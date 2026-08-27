import Card from './Card';

export default function ResultToolbar({ count, query, label = '총', emptyLabel = '현재 데이터 기준' }) {
  const hasQuery = Boolean(query?.trim());

  return (
    <Card hover={false} className="mb-5 flex min-h-14 flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-bold text-[var(--color-text-primary)]">
        {hasQuery ? '검색 결과' : label} <span className="text-[var(--color-primary)]">{count}{'개'}</span>
      </p>
      <p className="min-w-0 truncate text-sm text-[var(--color-text-secondary)]">
        {hasQuery ? <><span className="font-semibold text-[var(--color-text-primary)]">{query}</span>{' 기준'}</> : emptyLabel}
      </p>
    </Card>
  );
}
