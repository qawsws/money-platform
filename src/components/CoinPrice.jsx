import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getCryptoPrices } from '../services/api';
import { useFavoritesStore } from '../store/favoritesStore';
import Card from './ui/Card';
import PageHeader from './ui/PageHeader';
import QuoteCard from './ui/QuoteCard';
import QuoteSectionHeader from './ui/QuoteSectionHeader';
import ResultToolbar from './ui/ResultToolbar';

const t = {
  title: '\uC554\uD638\uD654\uD3D0',
  description: '\uC8FC\uC694 \uCF54\uC778\uC758 \uD604\uC7AC \uAC00\uACA9\uACFC \uBCC0\uB3D9\uB960\uC744 \uD655\uC778\uD558\uC138\uC694.',
  pageDescription: '\uC8FC\uC694 \uC554\uD638\uD654\uD3D0\uC758 \uD604\uC7AC \uAC00\uACA9\uACFC 24\uC2DC\uAC04 \uBCC0\uB3D9 \uC815\uBCF4\uB97C \uD55C\uB208\uC5D0 \uD655\uC778\uD558\uC138\uC694.',
  favorite: '\uC990\uACA8\uCC3E\uAE30',
  more: '\uB354\uBCF4\uAE30',
  error: '\uC554\uD638\uD654\uD3D0 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.',
  empty: '\uD45C\uC2DC\uD560 \uCF54\uC778 \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.',
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
        {isPage && <ResultToolbar count={coins.length} />}
        {isLoading && <QuoteSkeletonGrid count={limit || 4} />}
        {error && <SectionState message={t.error} onRetry={refetch} />}
        {!isLoading && !error && (
          coins.length === 0 ? <SectionState message={t.empty} /> : (
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
                    description="암호화폐 시장 변동률"
                    onOpen={() => onOpenDetail?.(coin)}
                    favoriteAction={<FavoriteButton selected={selected} label={`${coin.name} ${t.favorite}`} onClick={(event) => { event.stopPropagation(); toggle(`crypto:${coin.id}`); }} />}
                  />
                );
              })}
            </div>
          )
        )}
      </div>
    </section>
  );
}
