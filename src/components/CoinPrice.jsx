import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getCryptoPrices } from '../services/api';
import { useFavoritesStore } from '../store/favoritesStore';
import AssetPageInsights from './AssetPageInsights';
import Card from './ui/Card';
import PageHeader from './ui/PageHeader';
import QuoteCard from './ui/QuoteCard';
import QuoteSectionHeader from './ui/QuoteSectionHeader';

const t = {
  title: '암호화폐',
  description: '주요 코인의 현재 가격과 변동률을 확인하세요.',
  pageDescription: '비트코인, 이더리움 등 주요 암호화폐의 가격과 24시간 변동률을 정리했습니다.',
  favorite: '관심 추가',
  saved: '관심 등록됨',
  more: '더보기',
  error: '암호화폐 정보를 불러오지 못했습니다.',
  empty: '표시할 코인 정보가 없습니다.',
  retry: '다시 시도',
};

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

function CryptoSummary({ coins }) {
  const rising = coins.filter((coin) => coin.isPositive).length;
  const falling = coins.length - rising;
  const first = coins[0];

  return (
    <Card hover={false} className="mb-5 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black text-[var(--color-primary)]">코인 시세 요약</p>
          <h2 className="mt-2 text-2xl font-black text-[var(--color-text-primary)]">24시간 변동률 기준으로 확인하세요</h2>
          <p className="mt-2 text-sm font-semibold text-[var(--color-text-secondary)]">현재 표시 중인 코인의 가격, 등락률, 관심 등록을 한 화면에서 볼 수 있습니다.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:min-w-[420px]">
          <div className="rounded-xl bg-[var(--color-background-soft)] px-4 py-3">
            <p className="text-xs font-black text-[var(--color-text-secondary)]">표시 코인</p>
            <p className="mt-1 text-lg font-black text-[var(--color-text-primary)]">{coins.length}개</p>
          </div>
          <div className="rounded-xl bg-red-50 px-4 py-3">
            <p className="text-xs font-black text-red-500">상승</p>
            <p className="mt-1 text-lg font-black text-red-500">{rising}</p>
          </div>
          <div className="rounded-xl bg-blue-50 px-4 py-3">
            <p className="text-xs font-black text-blue-600">하락</p>
            <p className="mt-1 text-lg font-black text-blue-600">{falling}</p>
          </div>
        </div>
      </div>
      {first && <p className="mt-4 border-t border-[var(--color-border)] pt-4 text-sm font-semibold text-[var(--color-text-secondary)]">대표 표시: {first.name} {first.price}</p>}
    </Card>
  );
}

export default function CoinPrice({ onOpenDetail, limit = null, showMore = false }) {
  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ['crypto'], queryFn: getCryptoPrices });
  const favorites = useFavoritesStore((state) => state.favorites);
  const toggle = useFavoritesStore((state) => state.toggle);
  const coins = limit ? data.slice(0, limit) : data;
  const isPage = !limit && !showMore;

  return (
    <section id="crypto" className="py-7">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {isPage ? <PageHeader eyebrow="자산 목록" title={t.title} description={t.pageDescription} /> : <QuoteSectionHeader title={t.title} description={t.description} action={showMore && <Link to="/crypto" className="text-sm font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">{t.more}</Link>} />}
        {isLoading && <QuoteSkeletonGrid count={limit || 4} />}
        {error && <SectionState message={t.error} onRetry={refetch} />}
        {!isLoading && !error && (
          coins.length === 0 ? <SectionState message={t.empty} /> : (
            <>
              {isPage && <CryptoSummary coins={coins} />}
              {isPage && <AssetPageInsights items={coins} label="암호화폐" basis="24시간 변동률 기준" />}
              <div className={isPage ? 'mt-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-sm' : ''}>
                {isPage && (
                  <div className="mb-4 flex flex-col gap-2 border-b border-[var(--color-border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-xl font-black tracking-tight text-[var(--color-text-primary)]">코인 시세</h2>
                      <p className="mt-1 text-sm font-semibold leading-6 text-[var(--color-text-secondary)]">가격과 24시간 변동률을 기준으로 표시합니다.</p>
                    </div>
                    <span className="w-fit rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-black text-[var(--color-primary)]">{coins.length}개</span>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {coins.map((coin) => {
                    const selected = favorites.includes(`crypto:${coin.id}`);
                    return (
                      <QuoteCard
                        key={coin.id}
                        title={coin.name}
                        subtitle={coin.symbol}
                        value={coin.price}
                        change={coin.change}
                        isPositive={coin.isPositive}
                        badge="24H"
                        icon={coin.image}
                        description="암호화폐 24시간 변동률"
                        onOpen={() => onOpenDetail?.(coin)}
                        favoriteAction={<FavoriteButton selected={selected} label={`${coin.name} ${selected ? t.saved : t.favorite}`} onClick={(event) => { event.stopPropagation(); toggle(`crypto:${coin.id}`); }} />}
                      />
                    );
                  })}
                </div>
              </div>
            </>
          )
        )}
      </div>
    </section>
  );
}
