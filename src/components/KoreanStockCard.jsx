import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useSearch } from '../context/SearchContext';
import { getKoreanStocks } from '../services/api';
import { useFavoritesStore } from '../store/favoritesStore';
import AssetPageInsights from './AssetPageInsights';
import Card from './ui/Card';
import PageHeader from './ui/PageHeader';
import QuoteCard from './ui/QuoteCard';
import QuoteSectionHeader from './ui/QuoteSectionHeader';

const t = {
  title: '한국 주식',
  description: '주요 국내 주식의 가격과 등락률을 확인하세요.',
  pageTitle: '한국 주식',
  pageDescription: '국내 대표 종목의 현재가, 등락률, 관심 등록을 한 화면에서 확인하세요.',
  favorite: '관심 추가',
  saved: '관심 등록됨',
  empty: '검색어와 일치하는 종목이 없습니다.',
  result: '검색 결과',
  more: '더보기',
  error: '한국 주식 정보를 불러오지 못했습니다.',
  retry: '다시 시도',
};

function parseChange(change) {
  const parsed = Number(String(change || '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function QuoteSkeletonGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} hover={false} className="min-h-[170px] p-5">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-28 rounded bg-slate-100" />
            <div className="h-8 w-32 rounded bg-slate-100" />
            <div className="h-4 w-20 rounded bg-slate-100" />
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
      className={`rounded-full border px-3 py-1 text-xs font-bold ${selected ? 'border-amber-400 bg-amber-400 text-white' : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
    >
      {selected ? t.saved : t.favorite}
    </button>
  );
}

function StockSummary({ stocks }) {
  const decorated = stocks.map((stock) => ({ ...stock, changeValue: parseChange(stock.change) }));
  const rising = decorated.filter((stock) => stock.changeValue >= 0).length;
  const falling = decorated.length - rising;
  const strongest = [...decorated].sort((a, b) => Math.abs(b.changeValue) - Math.abs(a.changeValue))[0];

  return (
    <Card hover={false} className="mb-5 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black text-[var(--color-primary)]">한국 주식 요약</p>
          <h2 className="mt-2 text-2xl font-black text-[var(--color-text-primary)]">국내 대표 종목의 움직임을 확인하세요</h2>
          <p className="mt-2 text-sm font-semibold text-[var(--color-text-secondary)]">현재 표시 중인 종목의 현재가와 전일 대비 등락률을 기준으로 정리했습니다.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:min-w-[420px]">
          <SummaryChip label="상승" value={rising} tone="up" />
          <SummaryChip label="하락" value={falling} tone="down" />
          <SummaryChip label="변동 큰 종목" value={strongest?.symbol || '-'} />
        </div>
      </div>
    </Card>
  );
}

function SummaryChip({ label, value, tone }) {
  const toneClass = tone === 'up' ? 'bg-red-50 text-red-500' : tone === 'down' ? 'bg-blue-50 text-blue-600' : 'bg-[var(--color-background-soft)] text-[var(--color-text-primary)]';
  return (
    <div className={'rounded-xl px-4 py-3 ' + toneClass}>
      <p className="text-xs font-black opacity-75">{label}</p>
      <p className="mt-1 truncate text-lg font-black">{value}</p>
    </div>
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
        {isLoading && <QuoteSkeletonGrid count={limit || 4} />}
        {error && <SectionState message={t.error} onRetry={refetch} />}
        {!isLoading && !error && (
          <>
            {normalizedQuery && <p className="mb-3 text-sm text-[var(--color-text-secondary)]">{t.result}: <b className="text-[var(--color-text-primary)]">{query}</b> ({filtered.length})</p>}
            {stocks.length === 0 ? <SectionState message={t.empty} /> : (
              <>
                {isPage && <StockSummary stocks={stocks} />}
                {isPage && <AssetPageInsights items={stocks} label="한국 주식" basis="전일 대비 등락률 기준" />}
                <div className={isPage ? 'mt-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-sm' : ''}>
                  {isPage && (
                    <div className="mb-4 flex flex-col gap-2 border-b border-[var(--color-border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
                      <div className="min-w-0">
                        <h2 className="text-xl font-black tracking-tight text-[var(--color-text-primary)]">한국 주식 시세</h2>
                        <p className="mt-1 text-sm font-semibold leading-6 text-[var(--color-text-secondary)]">종목명, 종목코드, 현재가, 등락률을 카드로 정리했습니다.</p>
                      </div>
                      <span className="w-fit rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-black text-[var(--color-primary)]">{stocks.length}개</span>
                    </div>
                  )}
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
                          favoriteAction={<FavoriteButton selected={selected} label={`${stock.name} ${selected ? t.saved : t.favorite}`} onClick={(event) => { event.stopPropagation(); toggle(`korean-stock:${stock.id}`); }} />}
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
