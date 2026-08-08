import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getMarketIndices } from '../services/api';
import Card from './ui/Card';
import PageHeader from './ui/PageHeader';
import QuoteCard from './ui/QuoteCard';
import QuoteSectionHeader from './ui/QuoteSectionHeader';
import ResultToolbar from './ui/ResultToolbar';

const t = {
  title: '\uC624\uB298\uC758 \uC2DC\uC7A5',
  description: '\uC8FC\uC694 \uC9C0\uC218\uC758 \uD750\uB984\uC744 \uD55C\uB208\uC5D0 \uD655\uC778\uD558\uC138\uC694.',
  pageTitle: '\uC2DC\uC7A5 \uC9C0\uC218',
  pageDescription: '\uC8FC\uC694 \uAD6D\uB0B4\uC678 \uC2DC\uC7A5 \uC9C0\uC218\uC758 \uD604\uC7AC \uD750\uB984\uACFC \uB4F1\uB77D \uC815\uBCF4\uB97C \uD655\uC778\uD558\uC138\uC694.',
  more: '\uB354\uBCF4\uAE30',
  error: '\uC2DC\uC7A5 \uC9C0\uC218 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.',
  empty: '\uD45C\uC2DC\uD560 \uC2DC\uC7A5 \uC9C0\uC218\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.',
  retry: '\uB2E4\uC2DC \uC2DC\uB3C4',
};

function QuoteSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((id) => (
        <Card key={id} hover={false} className="min-h-[190px] p-5">
          <div className="animate-pulse">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-slate-100" />
              <div className="min-w-0 flex-1">
                <div className="h-4 w-24 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-16 rounded bg-slate-100" />
              </div>
            </div>
            <div className="mt-7 h-7 w-32 rounded bg-slate-100" />
            <div className="mt-3 h-6 w-20 rounded-full bg-slate-100" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function SectionState({ message, onRetry }) {
  return (
    <Card hover={false} className="flex min-h-40 flex-col items-center justify-center p-6 text-center">
      <p className="text-sm font-bold text-[var(--color-text-secondary)]">{message}</p>
      {onRetry && <button type="button" onClick={onRetry} className="mt-4 rounded-full bg-[var(--color-primary-soft)] px-4 py-2 text-sm font-bold text-[var(--color-primary)] hover:bg-blue-100">{t.retry}</button>}
    </Card>
  );
}

export default function MarketIndex({ onOpenDetail, limit = null, showMore = false }) {
  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ['market', 'indices'], queryFn: getMarketIndices });
  const items = limit ? data.slice(0, limit) : data;
  const isPage = !limit && !showMore;

  return (
    <section id="market" className="py-7">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {isPage ? <PageHeader eyebrow="자산 목록" title={t.pageTitle} description={t.pageDescription} /> : <QuoteSectionHeader title={t.title} description={t.description} action={showMore && <Link to="/market" className="text-sm font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">{t.more}</Link>} />}
        {isPage && <ResultToolbar count={items.length} />}
        {isLoading && <QuoteSkeletonGrid />}
        {error && <SectionState message={t.error} onRetry={refetch} />}
        {!isLoading && !error && (
          items.length === 0 ? <SectionState message={t.empty} /> : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {items.map((item) => (
                <QuoteCard
                  key={item.id}
                  title={item.name}
                  subtitle={item.icon}
                  value={item.value}
                  change={item.change}
                  isPositive={item.isPositive}
                  badge={item.icon}
                  icon={item.icon}
                  description="주요 지수 변동률"
                  onOpen={() => onOpenDetail?.(item)}
                />
              ))}
            </div>
          )
        )}
      </div>
    </section>
  );
}
