import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useSearch } from '../context/SearchContext';
import { getUsStocks } from '../services/api';
import { useFavoritesStore } from '../store/favoritesStore';
import AssetPageInsights from './AssetPageInsights';
import Card from './ui/Card';
import PageHeader from './ui/PageHeader';
import QuoteCard from './ui/QuoteCard';
import QuoteSectionHeader from './ui/QuoteSectionHeader';

const t = {
  title: '인기 미국 주식',
  description: '많은 투자자가 관심을 갖는 종목을 살펴보세요.',
  pageTitle: '미국 주식',
  pageDescription: '주요 미국 주식의 현재 가격과 등락 정보를 확인하세요.',
  favorite: '즐겨찾기',
  empty: '검색어와 일치하는 종목이 없습니다.',
  result: '검색 결과',
  more: '더보기',
  error: '주식 정보를 불러오지 못했습니다.',
  retry: '다시 시도',
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
      {onRetry && <button type="button" onClick={onRetry} className="mt-4 rounded-full bg-[var(--color-primary-soft)] px-4 py-2 text-sm font-bold text-[var(--color-primary)] hover:bg-emerald-100">{t.retry}</button>}
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
      {selected ? '★' : '☆'} {t.favorite}
    </button>
  );
}

export default function StockCard({ onOpenDetail, limit = null, showMore = false }) {
  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ['stocks', 'us'], queryFn: getUsStocks });
  const { query } = useSearch();
  const favorites = useFavoritesStore((state) => state.favorites);
  const toggle = useFavoritesStore((state) => state.toggle);
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = data.filter((stock) => !normalizedQuery || [stock.symbol, stock.name, stock.description].join(' ').toLowerCase().includes(normalizedQuery));
  const stocks = limit ? filtered.slice(0, limit) : filtered;
  const isPage = !limit && !showMore;

  return (
    <section id="stocks" className="py-7">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {isPage ? <PageHeader eyebrow="자산 목록" title={t.pageTitle} description={t.pageDescription} /> : <QuoteSectionHeader title={t.title} description={t.description} action={showMore && <Link to="/stocks/us" className="text-sm font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">{t.more}</Link>} />}
        {isLoading && <QuoteSkeletonGrid count={limit || 4} />}
        {error && <SectionState message={t.error} onRetry={refetch} />}
        {!isLoading && !error && (
          <>
            {normalizedQuery && <p className="mb-3 text-sm text-[var(--color-text-secondary)]">{t.result}: <b className="text-[var(--color-text-primary)]">{query}</b> ({filtered.length})</p>}
            {stocks.length === 0 ? <SectionState message={t.empty} /> : (
              <>
                {isPage && <AssetPageInsights items={stocks} label="미국 주식" basis="전일 대비 등락률 기준" />}
                <div className={isPage ? 'mt-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-sm' : ''}>
                  {isPage && (
                  <div className="mb-4 flex flex-col gap-2 border-b border-[var(--color-border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-xl font-black tracking-tight text-[var(--color-text-primary)]">전체 미국 주식</h2>
                      <p className="mt-1 text-sm font-semibold leading-6 text-[var(--color-text-secondary)]">현재 표시 중인 미국 주식 목록입니다.</p>
                    </div>
                    <span className="w-fit rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-black text-[var(--color-primary)]">{stocks.length}개</span>
                  </div>
                )}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stocks.map((stock) => {
                      const selected = favorites.includes(`stock:${stock.id}`);
                      return (
                        <QuoteCard
                          key={stock.id}
                          title={stock.name}
                          subtitle={stock.symbol}
                          value={stock.price}
                          change={stock.change}
                          isPositive={stock.isPositive}
                          badge="미국"
                          icon={stock.symbol}
                          description={stock.description}
                          onOpen={() => onOpenDetail?.(stock)}
                          favoriteAction={<FavoriteButton selected={selected} label={`${stock.name} ${t.favorite}`} onClick={(event) => { event.stopPropagation(); toggle(`stock:${stock.id}`); }} />}
                        />
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}


