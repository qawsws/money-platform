import { useQuery } from '@tanstack/react-query';
import Card from './ui/Card';
import { getCryptoPrices, getKoreanStocks, getMarketIndices, getNews, getUsStocks } from '../services/api';

const t = {
  eyebrow: '\uC624\uB298\uC758 \uC2DC\uC7A5',
  upCount: '\uC0C1\uC2B9 \uC790\uC0B0',
  downCount: '\uD558\uB77D \uC790\uC0B0',
  topGainer: '\uCD5C\uACE0 \uC0C1\uC2B9',
  topLoser: '\uCD5C\uACE0 \uD558\uB77D',
  noData: '\uB370\uC774\uD130 \uC5C6\uC74C',
  empty: '\uD45C\uC2DC\uD560 \uC2DC\uC7A5 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.',
  error: '\uC2DC\uC7A5 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.',
  retry: '\uB2E4\uC2DC \uC2DC\uB3C4',
  refresh: '\uC0C8\uB85C\uACE0\uCE68',
  refreshing: '\uC5C5\uB370\uC774\uD2B8 \uC911',
  updatedNow: '\uD604\uC7AC \uB370\uC774\uD130 \uAE30\uC900',
  source: '\uC8FC\uC694 \uC9C0\uC218, \uCF54\uC778, \uBBF8\uAD6D\uC8FC\uC2DD, \uD55C\uAD6D\uC8FC\uC2DD\uC758 \uB4F1\uB77D\uC744 \uD55C \uBC88\uC5D0 \uC0B4\uD3B4\uBCF4\uC138\uC694.',
  watch: '\uAD00\uC2EC \uC815\uBCF4',
};

const parseChange = (item) => Number.parseFloat(String(item?.change || '').replace('%', '').replace('+', ''));

const marketAsset = (item, group) => ({
  ...item,
  group,
  title: item?.symbol || item?.name || '-',
  subtitle: item?.name || item?.description || group,
  changeValue: parseChange(item),
});

const formatUpdatedAt = (timestamp) => {
  if (!timestamp) return t.updatedNow;
  return `${new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(timestamp))} \uAE30\uC900`;
};

const getMarketMood = (positive, negative) => {
  if (positive > negative) {
    return {
      label: '\uC0C1\uC2B9 \uC6B0\uC138',
      title: '\uC624\uB298\uC740 \uC0C1\uC2B9 \uC790\uC0B0\uC774 \uC6B0\uC138\uD569\uB2C8\uB2E4',
      description: '\uC0C1\uC2B9 \uC790\uC0B0\uC774 \uB354 \uB9CE\uC9C0\uB9CC, \uAC1C\uBCC4 \uC790\uC0B0\uBCC4 \uBCC0\uB3D9\uB960\uC740 \uD568\uAED8 \uD655\uC778\uD558\uB294 \uAC83\uC774 \uC88B\uC2B5\uB2C8\uB2E4.',
      className: 'bg-[var(--color-positive-soft)] text-[var(--color-positive)]',
    };
  }
  if (negative > positive) {
    return {
      label: '\uD558\uB77D \uC6B0\uC138',
      title: '\uC624\uB298\uC740 \uC2DC\uC7A5 \uC804\uBC18\uC758 \uBCC0\uB3D9\uC131\uC774 \uB192\uC2B5\uB2C8\uB2E4',
      description: '\uD558\uB77D \uC790\uC0B0\uC774 \uB354 \uB9CE\uC544 \uC8FC\uC694 \uC9C0\uC218\uC640 \uAD00\uC2EC \uC885\uBAA9\uC758 \uBCC0\uD654\uB97C \uCC28\uBD84\uD788 \uBE44\uAD50\uD574\uBCF4\uC138\uC694.',
      className: 'bg-[var(--color-negative-soft)] text-[var(--color-negative)]',
    };
  }
  return {
    label: '\uD63C\uC870\uC138',
    title: '\uC624\uB298\uC740 \uC0C1\uC2B9\uACFC \uD558\uB77D\uC774 \uD63C\uC870\uC138\uC785\uB2C8\uB2E4',
    description: '\uC790\uC0B0\uAD70\uBCC4\uB85C \uB4F1\uB77D\uC774 \uAC08\uB9AC\uACE0 \uC788\uC5B4 \uB274\uC2A4\uC640 \uC885\uBAA9 \uBCC0\uB3D9\uB960\uC744 \uD568\uAED8 \uD655\uC778\uD574\uBCF4\uC138\uC694.',
    className: 'bg-slate-100 text-[var(--color-text-secondary)]',
  };
};

function SummarySkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
      <Card hover={false} className="min-h-[340px] p-6 sm:p-8">
        <div className="animate-pulse">
          <div className="h-5 w-24 rounded-full bg-slate-100" />
          <div className="mt-5 h-10 max-w-xl rounded bg-slate-100" />
          <div className="mt-4 h-5 max-w-2xl rounded bg-slate-100" />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-32 rounded-2xl bg-slate-100" />)}
          </div>
        </div>
      </Card>
    </section>
  );
}

function SummaryMetricCard({ label, value, description, tone = 'neutral' }) {
  const toneClass = tone === 'positive' ? 'text-[var(--color-positive)]' : tone === 'negative' ? 'text-[var(--color-negative)]' : 'text-[var(--color-text-primary)]';

  return (
    <Card hover={false} className="min-h-32 p-4">
      <p className="text-xs font-bold text-[var(--color-text-secondary)]">{label}</p>
      <p className={`mt-3 truncate text-2xl font-extrabold tracking-tight ${toneClass}`}>{value}</p>
      <p className="mt-2 line-clamp-2 text-sm leading-5 text-[var(--color-text-secondary)]">{description}</p>
    </Card>
  );
}

function RefreshIcon({ spinning }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`size-4 ${spinning ? 'animate-spin' : ''}`}>
      <path d="M20 12a8 8 0 0 1-13.7 5.6M4 12A8 8 0 0 1 17.7 6.4M18 3v4h-4M6 21v-4h4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

export default function HomeSummary() {
  const market = useQuery({ queryKey: ['market', 'indices'], queryFn: getMarketIndices });
  const crypto = useQuery({ queryKey: ['crypto'], queryFn: getCryptoPrices });
  const stocks = useQuery({ queryKey: ['stocks', 'us'], queryFn: getUsStocks });
  const koreanStocks = useQuery({ queryKey: ['stocks', 'kr'], queryFn: getKoreanStocks });
  const news = useQuery({ queryKey: ['news'], queryFn: getNews });
  const queries = [market, crypto, stocks, koreanStocks, news];
  const isLoading = queries.some((query) => query.isLoading);
  const isFetching = queries.some((query) => query.isFetching);
  const error = queries.find((query) => query.error)?.error;

  const assets = [
    ...(market.data || []).map((item) => marketAsset(item, '\uC9C0\uC218')),
    ...(crypto.data || []).map((item) => marketAsset(item, '\uCF54\uC778')),
    ...(stocks.data || []).map((item) => marketAsset(item, '\uBBF8\uAD6D\uC8FC\uC2DD')),
    ...(koreanStocks.data || []).map((item) => marketAsset(item, '\uD55C\uAD6D\uC8FC\uC2DD')),
  ].filter((item) => Number.isFinite(item.changeValue));

  const positive = assets.filter((item) => item.isPositive).length;
  const negative = assets.filter((item) => !item.isPositive).length;
  const topGainer = assets.filter((item) => item.changeValue >= 0).sort((a, b) => b.changeValue - a.changeValue)[0];
  const topLoser = assets.filter((item) => item.changeValue < 0).sort((a, b) => a.changeValue - b.changeValue)[0];
  const mood = getMarketMood(positive, negative);
  const latestNews = news.data?.[0];
  const updatedAt = Math.max(...queries.map((query) => query.dataUpdatedAt || 0));

  const refetchAll = () => {
    queries.forEach((query) => query.refetch());
  };

  if (isLoading) return <SummarySkeleton />;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
      <Card hover={false} className="overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-[var(--color-primary)]">{t.eyebrow}</span>
              {!error && <span className={`rounded-full px-3 py-1 text-xs font-bold ${mood.className}`}>{mood.label}</span>}
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">{error ? t.error : mood.title}</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">{error ? t.source : t.source}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
            <span>{formatUpdatedAt(updatedAt)}</span>
            <button
              type="button"
              onClick={refetchAll}
              disabled={isFetching}
              aria-label={isFetching ? t.refreshing : t.refresh}
              className="grid size-8 place-items-center rounded-full text-[var(--color-primary)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshIcon spinning={isFetching} />
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="font-bold text-amber-800">{t.error}</p>
            <p className="mt-1 text-sm text-amber-700">{String(error?.message || error)}</p>
            <button type="button" onClick={refetchAll} disabled={isFetching} className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-bold text-amber-800 shadow-sm hover:bg-amber-100 disabled:opacity-50">
              {isFetching ? t.refreshing : t.retry}
            </button>
          </div>
        ) : assets.length === 0 ? (
          <div className="mt-8 flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] p-6 text-sm font-semibold text-[var(--color-text-secondary)]">
            {t.empty}
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryMetricCard label={t.upCount} value={`${positive}\uAC1C`} description={`\uD655\uC778 \uC790\uC0B0 ${assets.length}\uAC1C \uC911 \uC0C1\uC2B9 \uD45C\uC2DC`} tone="positive" />
              <SummaryMetricCard label={t.downCount} value={`${negative}\uAC1C`} description={`\uD655\uC778 \uC790\uC0B0 ${assets.length}\uAC1C \uC911 \uD558\uB77D \uD45C\uC2DC`} tone="negative" />
              <SummaryMetricCard label={t.topGainer} value={topGainer?.title || '-'} description={topGainer ? `${topGainer.group} · ${topGainer.change}` : t.noData} tone="positive" />
              <SummaryMetricCard label={t.topLoser} value={topLoser?.title || '-'} description={topLoser ? `${topLoser.group} · ${topLoser.change}` : t.noData} tone="negative" />
            </div>

            <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">{t.watch}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{mood.description}</p>
                </div>
                <div className="min-w-0 rounded-full bg-white px-3 py-2 text-sm font-semibold text-[var(--color-text-secondary)] shadow-sm">
                  <span className="truncate">{latestNews ? `${latestNews.category} · ${latestNews.title}` : t.noData}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>
    </section>
  );
}
