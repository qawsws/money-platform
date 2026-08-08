import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useSearch } from '../context/SearchContext';
import { getKoreanStocks } from '../services/api';
import { useFavoritesStore } from '../store/favoritesStore';
import Card from './ui/Card';
import PageHeader from './ui/PageHeader';
import QuoteCard from './ui/QuoteCard';
import QuoteSectionHeader from './ui/QuoteSectionHeader';
import ResultToolbar from './ui/ResultToolbar';

const t = {
  title: '\uC778\uAE30 \uD55C\uAD6D \uC8FC\uC2DD',
  description: '\uAD6D\uB0B4 \uD22C\uC790\uC790\uAC00 \uB9CE\uC774 \uD655\uC778\uD558\uB294 \uC8FC\uC694 \uC885\uBAA9\uC744 \uC0B4\uD3B4\uBCF4\uC138\uC694.',
  pageTitle: '\uD55C\uAD6D \uC8FC\uC2DD',
  pageDescription: '\uC8FC\uC694 \uAD6D\uB0B4 \uC8FC\uC2DD\uC758 \uD604\uC7AC\uAC00\uC640 \uBCC0\uB3D9 \uC815\uBCF4\uB97C \uD655\uC778\uD558\uC138\uC694.',
  favorite: '\uC990\uACA8\uCC3E\uAE30',
  empty: '\uAC80\uC0C9\uC5B4\uC640 \uC77C\uCE58\uD558\uB294 \uC885\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.',
  result: '\uAC80\uC0C9 \uACB0\uACFC',
  more: '\uB354\uBCF4\uAE30',
  error: '\uC8FC\uC2DD \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.',
  retry: '\uB2E4\uC2DC \uC2DC\uB3C4',
};

function QuoteSkeletonGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} hover={false} className="min-h-[190px] p-5">
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

function FavoriteButton({ selected, label, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-bold ${selected ? 'border-amber-400 bg-amber-400 text-white' : 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
    >
      {selected ? '\u2605' : '\u2606'} {t.favorite}
    </button>
  );
}

export default function KoreanStockCard({ onOpenDetail, limit = null, showMore = false }) {
  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ['stocks', 'kr'], queryFn: getKoreanStocks });
  const { query } = useSearch();
  const favorites = useFavoritesStore((state) => state.favorites);
  const toggle = useFavoritesStore((state) => state.toggle);
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = data.filter((stock) => !normalizedQuery || [stock.symbol, stock.name, stock.description].join(' ').toLowerCase().includes(normalizedQuery));
  const stocks = limit ? filtered.slice(0, limit) : filtered;
  const isPage = !limit && !showMore;

  return (
    <section id="korean-stocks" className="py-7">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {isPage ? <PageHeader eyebrow="자산 목록" title={t.pageTitle} description={t.pageDescription} /> : <QuoteSectionHeader title={t.title} description={t.description} action={showMore && <Link to="/stocks/kr" className="text-sm font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">{t.more}</Link>} />}
        {isPage && <ResultToolbar count={stocks.length} query={query} />}
        {isLoading && <QuoteSkeletonGrid count={limit || 4} />}
        {error && <SectionState message={t.error} onRetry={refetch} />}
        {!isLoading && !error && (
          <>
            {normalizedQuery && <p className="mb-3 text-sm text-[var(--color-text-secondary)]">{t.result}: <b className="text-[var(--color-text-primary)]">{query}</b> ({filtered.length})</p>}
            {stocks.length === 0 ? <SectionState message={t.empty} /> : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stocks.map((stock) => {
                  const selected = favorites.includes(`korean-stock:${stock.id}`);
                  return (
                    <QuoteCard
                      key={stock.id}
                      title={stock.name}
                      subtitle={stock.symbol}
                      value={stock.price}
                      change={stock.change}
                      isPositive={stock.isPositive}
                      badge="한국"
                      icon={stock.name}
                      description={stock.description}
                      onOpen={() => onOpenDetail?.(stock)}
                      favoriteAction={<FavoriteButton selected={selected} label={`${stock.name} ${t.favorite}`} onClick={(event) => { event.stopPropagation(); toggle(`korean-stock:${stock.id}`); }} />}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
