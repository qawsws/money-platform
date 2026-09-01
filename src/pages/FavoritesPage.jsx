import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import AssetIcon from '../components/ui/AssetIcon';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import PriceChangeBadge from '../components/ui/PriceChangeBadge';
import { useAuth } from '../context/AuthContext';
import { deleteSavedNews, getCryptoPrices, getKoreanStocks, getSavedNews, getUsStocks } from '../services/api';
import { useFavoritesStore } from '../store/favoritesStore';

const t = {
  title: '관심 자산',
  guest: '로그인하면 관심 종목과 저장한 뉴스를 확인할 수 있습니다.',
  description: '관심 있는 주식과 암호화폐, 저장한 뉴스를 한곳에서 확인하세요.',
  crypto: '암호화폐',
  stocks: '미국 주식',
  koreanStocks: '한국 주식',
  news: '저장한 뉴스',
  empty: '아직 관심 자산이 없습니다.',
  emptyDescription: '관심 있는 주식이나 암호화폐를 관심 자산으로 추가해보세요.',
  emptyNews: '아직 저장한 뉴스가 없습니다.',
  remove: '관심 해제',
  removeNews: '뉴스 저장 해제',
  confirm: '관심 자산에서 삭제할까요?',
  confirmNews: '저장한 뉴스에서 삭제할까요?',
  retry: '다시 시도',
  total: '전체 관심 항목',
  assets: '관심 자산',
  savedNews: '저장 뉴스',
  currentData: '현재 데이터 기준',
  viewDetail: '상세 보기',
};

function StatusCard({ title, description, action }) {
  return (
    <Card hover={false} className="grid min-h-56 place-items-center p-8 text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-[var(--color-primary-soft)] text-sm font-black text-[var(--color-primary)]">F</span>
        <h2 className="mt-4 text-lg font-extrabold text-[var(--color-text-primary)]">{title}</h2>
        {description && <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </Card>
  );
}

function SummaryCard({ label, value, description }) {
  return (
    <Card hover={false} className="min-h-28 p-5">
      <p className="text-sm font-bold text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight text-[var(--color-text-primary)]">{value}</p>
      {description && <p className="mt-2 text-xs font-medium text-[var(--color-text-tertiary)]">{description}</p>}
    </Card>
  );
}

function SectionTitle({ title, count, description }) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)]">{title}</h2>
        {description && <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>}
      </div>
      <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[var(--color-primary)] shadow-[var(--shadow-card)]">{count}개</span>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} hover={false} className="min-h-[190px] p-5">
          <div className="animate-pulse">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-slate-100" />
              <div className="flex-1">
                <div className="h-4 w-24 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-16 rounded bg-slate-100" />
              </div>
              <div className="size-9 rounded-full bg-slate-100" />
            </div>
            <div className="mt-8 h-7 w-28 rounded bg-slate-100" />
            <div className="mt-4 h-6 w-20 rounded-full bg-slate-100" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function StarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4">
      <path d="m10 2.8 2.2 4.46 4.92.72-3.56 3.47.84 4.9L10 14.03 5.6 16.35l.84-4.9L2.88 7.98l4.92-.72L10 2.8Z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}

function FavoriteAssetCard({ item, type, typeLabel, detailTo, detailState, onRemove }) {
  const title = item.name || item.symbol || item.title;
  const subtitle = item.symbol || item.code || typeLabel;

  return (
    <Card as="article" className="relative min-h-[210px] overflow-hidden p-5 hover:border-[var(--color-border-strong)]">
      <Link to={detailTo} state={detailState} aria-label={`${title} ${t.viewDetail}`} className="absolute inset-0 z-0 rounded-[var(--radius-card)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2" />
      <div className="relative z-10 flex h-full flex-col pointer-events-none">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <AssetIcon label={title} symbol={subtitle} image={item.image || item.icon} />
            <div className="min-w-0">
              <h3 className="truncate text-base font-extrabold text-[var(--color-text-primary)]">{title || '-'}</h3>
              <p className="mt-0.5 truncate text-sm font-medium text-[var(--color-text-secondary)]">{subtitle || '-'}</p>
            </div>
          </div>
          <button type="button" onClick={(event) => { event.stopPropagation(); onRemove(); }} aria-label={`${title} ${t.remove}`} className="pointer-events-auto inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500">
            <StarIcon />
          </button>
        </div>

        <div className="mt-7">
          <p className="truncate text-2xl font-black tracking-tight text-[var(--color-text-primary)]">{item.price || '-'}</p>
          <div className="mt-3"><PriceChangeBadge change={item.change} isPositive={item.isPositive} /></div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="truncate rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-extrabold text-[var(--color-primary)]">{typeLabel}</span>
          <span className="text-xs font-bold text-[var(--color-text-tertiary)]">{type}</span>
        </div>
      </div>
    </Card>
  );
}

function NewsCard({ item, detailTo, detailState, onRemove, removing }) {
  const title = item.title || item.newsKey;

  return (
    <Card as="article" className="relative min-h-[170px] overflow-hidden p-5 hover:border-[var(--color-border-strong)]">
      <Link to={detailTo} state={detailState} aria-label={`${title} ${t.viewDetail}`} className="absolute inset-0 z-0 rounded-[var(--radius-card)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2" />
      <div className="relative z-10 flex h-full flex-col pointer-events-none">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {item.category && <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-extrabold text-[var(--color-primary)]">{item.category}</span>}
            <h3 className="mt-3 line-clamp-2 text-base font-extrabold leading-6 text-[var(--color-text-primary)]">{title}</h3>
          </div>
          <button type="button" onClick={(event) => { event.stopPropagation(); onRemove(); }} disabled={removing} aria-label={`${title} ${t.removeNews}`} className="pointer-events-auto inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-60">
            <StarIcon />
          </button>
        </div>
        {item.summary && <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--color-text-secondary)]">{item.summary}</p>}
      </div>
    </Card>
  );
}

function AssetGroup({ title, description, query, items, type, typeLabel, empty, onRemove }) {
  return (
    <section>
      <SectionTitle title={title} count={items.length} description={description} />
      {query.isLoading && <LoadingGrid />}
      {query.error && <StatusCard title="관심 자산 정보를 불러오지 못했습니다" description="잠시 후 다시 시도해주세요." action={<button type="button" onClick={() => query.refetch()} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)]">{t.retry}</button>} />}
      {!query.isLoading && !query.error && items.length === 0 && <StatusCard title={empty} description="이 유형에 저장된 관심 자산이 없습니다." />}
      {!query.isLoading && !query.error && items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => <FavoriteAssetCard key={item.id} item={item} type={type} typeLabel={typeLabel} detailTo={`/detail/${type}/${item.id}`} detailState={{ item }} onRemove={() => onRemove(item)} />)}
        </div>
      )}
    </section>
  );
}

function NewsGroup({ query, items, onRemove, removing }) {
  return (
    <section>
      <SectionTitle title={t.news} count={items.length} description="나중에 다시 볼 뉴스를 모아둔 목록입니다." />
      {query.isLoading && <LoadingGrid />}
      {query.error && <StatusCard title="저장한 뉴스를 불러오지 못했습니다" description="잠시 후 다시 시도해주세요." action={<button type="button" onClick={() => query.refetch()} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)]">{t.retry}</button>} />}
      {!query.isLoading && !query.error && items.length === 0 && <StatusCard title={t.emptyNews} description="뉴스 상세 화면에서 저장한 뉴스가 여기에 표시됩니다." />}
      {!query.isLoading && !query.error && items.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => <NewsCard key={item.newsKey} item={item} detailTo={`/detail/news/${encodeURIComponent(item.newsKey)}`} detailState={{ item }} onRemove={() => onRemove(item)} removing={removing} />)}
        </div>
      )}
    </section>
  );
}

export default function FavoritesPage() {
  const { user } = useAuth();
  const favorites = useFavoritesStore((state) => state.favorites);
  const toggle = useFavoritesStore((state) => state.toggle);
  const client = useQueryClient();
  const crypto = useQuery({ queryKey: ['crypto'], queryFn: getCryptoPrices });
  const stocks = useQuery({ queryKey: ['stocks', 'us'], queryFn: getUsStocks });
  const koreanStocks = useQuery({ queryKey: ['stocks', 'kr'], queryFn: getKoreanStocks });
  const savedNews = useQuery({ queryKey: ['saved-news'], queryFn: () => getSavedNews(localStorage.getItem('mp_token') || ''), enabled: Boolean(user) });
  const removeNews = useMutation({ mutationFn: (newsKey) => deleteSavedNews(localStorage.getItem('mp_token') || '', newsKey), onSuccess: () => client.invalidateQueries({ queryKey: ['saved-news'] }) });

  const coins = (crypto.data || []).filter((item) => favorites.includes(`crypto:${item.id}`));
  const shares = (stocks.data || []).filter((item) => favorites.includes(`stock:${item.id}`));
  const koreanShares = (koreanStocks.data || []).filter((item) => favorites.includes(`korean-stock:${item.id}`));
  const savedNewsItems = savedNews.data?.news || [];
  const totalAssets = coins.length + shares.length + koreanShares.length;
  const totalItems = totalAssets + savedNewsItems.length;
  const hasLoadError = Boolean(crypto.error || stocks.error || koreanStocks.error || savedNews.error);

  if (!user) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Watchlist" title={t.title} description={t.guest} />
        <StatusCard title="로그인이 필요합니다" description="관심 자산은 로그인한 사용자 기준으로 저장됩니다." action={<Link to="/" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)]">메인으로 이동</Link>} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader eyebrow="Watchlist" title={t.title} description={`${user.username}님이 저장한 관심 자산과 뉴스입니다.`} />

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <SummaryCard label={t.total} value={`${totalItems}개`} description={t.currentData} />
        <SummaryCard label={t.assets} value={`${totalAssets}개`} description="암호화폐, 미국 주식, 한국 주식" />
        <SummaryCard label={t.savedNews} value={`${savedNewsItems.length}개`} description="저장한 뉴스" />
      </section>

      {totalItems === 0 && !hasLoadError && !crypto.isLoading && !stocks.isLoading && !koreanStocks.isLoading && !savedNews.isLoading ? (
        <StatusCard title={t.empty} description={t.emptyDescription} action={<div className="flex flex-col gap-2 sm:flex-row sm:justify-center"><Link to="/stocks/us" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)]">미국 주식 보기</Link><Link to="/crypto" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[var(--color-border)] px-5 text-sm font-bold text-[var(--color-text-secondary)] hover:bg-slate-50">암호화폐 보기</Link></div>} />
      ) : (
        <div className="space-y-10">
          <AssetGroup title={t.crypto} description="관심 등록한 암호화폐입니다." query={crypto} items={coins} type="crypto" typeLabel={t.crypto} empty={t.empty} onRemove={(item) => { if (window.confirm(t.confirm)) toggle(`crypto:${item.id}`); }} />
          <AssetGroup title={t.stocks} description="관심 등록한 미국 주식입니다." query={stocks} items={shares} type="stock" typeLabel={t.stocks} empty={t.empty} onRemove={(item) => { if (window.confirm(t.confirm)) toggle(`stock:${item.id}`); }} />
          <AssetGroup title={t.koreanStocks} description="관심 등록한 한국 주식입니다." query={koreanStocks} items={koreanShares} type="korean-stock" typeLabel={t.koreanStocks} empty={t.empty} onRemove={(item) => { if (window.confirm(t.confirm)) toggle(`korean-stock:${item.id}`); }} />
          <NewsGroup query={savedNews} items={savedNewsItems} removing={removeNews.isPending} onRemove={(item) => { if (window.confirm(t.confirmNews)) removeNews.mutate(item.newsKey); }} />
        </div>
      )}
    </main>
  );
}
