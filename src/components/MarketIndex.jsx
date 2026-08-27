import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getMarketIndices, getNews } from '../services/api';
import Card from './ui/Card';
import PageHeader from './ui/PageHeader';
import QuoteCard from './ui/QuoteCard';
import QuoteSectionHeader from './ui/QuoteSectionHeader';

const t = {
  title: '오늘의 시장',
  description: '주요 지수의 흐름을 한눈에 확인하세요.',
  pageEyebrow: '자산 목록',
  pageTitle: '시장 지수',
  pageDescription: '국내외 대표 지수의 전일 대비 등락률과 시장 흐름을 확인하세요.',
  more: '더보기',
  error: '시장 지수 정보를 불러오지 못했습니다.',
  empty: '표시할 시장 지수가 없습니다.',
  retry: '다시 시도',
};

const percentFormat = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 });

function parseChange(change) {
  const parsed = Number(String(change || '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPercent(value) {
  return (value > 0 ? '+' : '') + percentFormat.format(value) + '%';
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isKoreanIndex(item) {
  const text = String(item.icon || item.symbol || item.name || '').toUpperCase();
  return text.includes('KS') || text.includes('KOSPI') || String(item.name || '').includes('코스피');
}

function decorateItems(items) {
  return items.map((item) => ({ ...item, changeValue: parseChange(item.change) }));
}

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
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-4 rounded-full bg-[var(--color-primary-soft)] px-4 py-2 text-sm font-bold text-[var(--color-primary)] hover:bg-emerald-100">
          {t.retry}
        </button>
      )}
    </Card>
  );
}

function MarketOverview({ items }) {
  const rising = items.filter((item) => item.changeValue >= 0).length;
  const falling = items.length - rising;
  const strongest = [...items].sort((a, b) => b.changeValue - a.changeValue)[0];
  const avg = average(items.map((item) => item.changeValue));
  const metrics = [
    { label: '확인 지수', value: String(items.length) + '개', detail: '현재 표시 중인 대표 지수' },
    { label: '상승 / 하락', value: String(rising) + ' / ' + String(falling), detail: '전일 또는 24시간 등락률 기준', tone: rising >= falling ? 'up' : 'down' },
    { label: '가장 강한 지수', value: strongest?.icon || '-', detail: strongest ? strongest.name + ' ' + formatPercent(strongest.changeValue) : '-', tone: 'up' },
    { label: '평균 등락률', value: formatPercent(avg), detail: '표시 지수 평균', tone: avg >= 0 ? 'up' : 'down' },
  ];

  return (
    <Card hover={false} className="p-5">
      <div className="mb-4 flex flex-col gap-2 border-b border-[var(--color-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-black text-[var(--color-primary)]">총 {items.length}개</p>
        <p className="text-sm font-semibold text-[var(--color-text-muted)]">현재 데이터 기준</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const toneClass = metric.tone === 'up' ? 'text-red-500' : metric.tone === 'down' ? 'text-blue-600' : 'text-[var(--color-text-primary)]';
          return (
            <div key={metric.label} className="rounded-2xl bg-[var(--color-surface-muted)] px-5 py-4">
              <p className="text-sm font-extrabold text-[var(--color-text-secondary)]">{metric.label}</p>
              <p className={'mt-3 text-3xl font-black tracking-tight ' + toneClass}>{metric.value}</p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-text-muted)]">{metric.detail}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
function RankingList({ title, items, tone }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4">
      <h3 className="text-sm font-black text-[var(--color-text-primary)]">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--color-surface-muted)] px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-[var(--color-text-secondary)]">{index + 1}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[var(--color-text-primary)]">{item.name}</p>
                <p className="text-xs font-bold text-[var(--color-text-muted)]">{item.icon}</p>
              </div>
            </div>
            <p className={(tone === 'up' ? 'text-red-500' : 'text-blue-600') + ' shrink-0 text-sm font-black'}>{formatPercent(item.changeValue)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarketRankings({ items }) {
  const gainers = [...items].sort((a, b) => b.changeValue - a.changeValue).slice(0, 5);
  const losers = [...items].sort((a, b) => a.changeValue - b.changeValue).slice(0, 5);

  return (
    <Card hover={false} className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-[var(--color-text-secondary)]">시장 등락 랭킹</p>
          <h2 className="mt-2 text-2xl font-black text-[var(--color-text-primary)]">상승과 하락을 한눈에!</h2>
        </div>
        <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-black text-[var(--color-primary)]">전일 / 24시간 기준</span>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4">
        <RankingList title="상승 랭킹" items={gainers} tone="up" />
        <RankingList title="하락 랭킹" items={losers} tone="down" />
      </div>

    </Card>
  );
}

function ComparisonBar({ label, value, count }) {
  const width = Math.min(100, Math.max(8, Math.abs(value) * 20));
  const toneClass = value >= 0 ? 'bg-red-500' : 'bg-blue-600';
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm font-black">
        <span className="text-[var(--color-text-primary)]">{label}</span>
        <span className={value >= 0 ? 'text-red-500' : 'text-blue-600'}>{formatPercent(value)} · {count}개</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={'h-full rounded-full ' + toneClass} style={{ width: String(width) + '%' }} />
      </div>
    </div>
  );
}

function RegionComparison({ items }) {
  const usItems = items.filter((item) => !isKoreanIndex(item));
  const krItems = items.filter(isKoreanIndex);
  const usAverage = average(usItems.map((item) => item.changeValue));
  const krAverage = average(krItems.map((item) => item.changeValue));
  const leader = usAverage >= krAverage ? '미국 지수' : '한국 지수';

  return (
    <Card hover={false} className="p-5">
      <p className="text-sm font-extrabold text-[var(--color-text-secondary)]">지수권 비교</p>
      <h2 className="mt-2 text-2xl font-black text-[var(--color-text-primary)]">미국 지수 vs 한국 지수</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">표시된 대표 지수를 미국과 한국으로 나눠 평균 등락률을 비교합니다.</p>
      <div className="mt-5 space-y-4">
        <ComparisonBar label="미국 지수" value={usAverage} count={usItems.length} />
        <ComparisonBar label="한국 지수" value={krAverage} count={krItems.length} />
      </div>
      <div className="mt-5 rounded-2xl bg-[var(--color-surface-muted)] p-4">
        <p className="text-sm font-black text-[var(--color-text-primary)]">{leader}가 상대적으로 강한 흐름입니다.</p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">현재 데이터는 실시간 지연 또는 기본 데이터 환경에 따라 달라질 수 있습니다.</p>
      </div>
    </Card>
  );
}

function TrendPanel({ items }) {
  const points = items.map((item, index) => {
    const x = 20 + index * (260 / Math.max(1, items.length - 1));
    const y = 90 - Math.max(-5, Math.min(5, item.changeValue)) * 10;
    return { x, y, item };
  });
  const path = points.map((point, index) => (index === 0 ? 'M ' : 'L ') + point.x + ' ' + point.y).join(' ');

  return (
    <Card hover={false} className="p-5">
      <p className="text-sm font-extrabold text-[var(--color-text-secondary)]">시장 흐름</p>
      <h2 className="mt-2 text-2xl font-black text-[var(--color-text-primary)]">지수별 등락률 비교</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">가격 차트가 아니라 각 지수가 오늘 얼마나 움직였는지 비교하는 그래프입니다.</p>
      <div className="mt-5 rounded-3xl border border-[var(--color-border)] bg-gradient-to-b from-white to-slate-50 p-4">
        <svg viewBox="0 0 300 140" role="img" aria-label="지수별 등락률 비교 그래프" className="h-48 w-full">
          <line x1="14" y1="90" x2="286" y2="90" stroke="#e2e8f0" strokeWidth="2" />
          <path d={path} fill="none" stroke="var(--color-primary)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((point) => (
            <g key={point.item.id}>
              <circle cx={point.x} cy={point.y} r="5" fill="white" stroke="var(--color-primary)" strokeWidth="4" />
              <text x={point.x} y="126" textAnchor="middle" className="fill-slate-500 text-[10px] font-bold">{point.item.icon}</text>
            </g>
          ))}
        </svg>
      </div>
    </Card>
  );
}

function MarketNewsPanel({ news }) {
  const items = (news || []).slice(0, 6);
  return (
    <Card hover={false} className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-[var(--color-text-primary)]">시장 관련 뉴스</h2>
        <Link to="/news" className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 hover:bg-amber-100">{t.more}</Link>
      </div>
      <div className="mt-4 divide-y divide-[var(--color-border)]">
        {items.map((item) => (
          <Link key={item.id} to={'/detail/news/' + item.id} state={{ item }} className="block py-3 first:pt-0 last:pb-0">
            <p className="line-clamp-1 text-sm font-black text-[var(--color-text-primary)]">{item.title}</p>
            <p className="mt-1 line-clamp-1 text-xs font-semibold text-[var(--color-text-secondary)]">{item.category || '시장'} · {item.source || '실시간'}</p>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function Checkpoints() {
  const rows = [
    '지수는 개별 종목보다 시장 전체 분위기를 먼저 보는 기준입니다.',
    '같은 방향으로 움직이는 지수가 많을수록 시장 흐름을 더 강하게 볼 수 있습니다.',
    '지수 흐름을 확인한 뒤 코인, 미국 주식, 한국 주식 페이지에서 종목을 비교해보세요.',
    '실시간 지연 또는 기본 데이터 환경에서는 실제 시장과 차이가 날 수 있습니다.',
  ];

  return (
    <Card hover={false} className="p-5">
      <p className="text-sm font-extrabold text-[var(--color-text-secondary)]">점검 포인트</p>
      <h2 className="mt-2 text-2xl font-black text-[var(--color-text-primary)]">지수 볼 때 기준</h2>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <p key={row} className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-semibold leading-6 text-[var(--color-text-secondary)]">{row}</p>
        ))}
      </div>
    </Card>
  );
}
function MarketGuidePanel() {
  const guides = [
    'S&P 500, 나스닥, 다우존스는 미국 시장 분위기를 보는 대표 지수입니다.',
    '코스피는 국내 시장 분위기를 확인하는 기준으로 사용합니다.',
    '개별 종목을 보기 전에는 평균 방향과 상승·하락 랭킹을 함께 확인하세요.',
    '지수는 종목을 고르는 기능이 아니라 오늘 시장의 큰 방향을 읽는 참고 정보입니다.',
  ];

  return (
    <Card hover={false} className="h-full p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-[var(--color-text-secondary)]">오늘 시장 꿀팁</p>
          <h2 className="mt-2 text-xl font-black text-[var(--color-text-primary)]">지수 흐름을 이렇게 보세요</h2>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-black text-[var(--color-primary)]">참고</span>
      </div>
      <div className="mt-4 divide-y divide-[var(--color-border)]">
        {guides.map((guide) => (
          <p key={guide} className="py-3 text-sm font-semibold leading-6 text-[var(--color-text-secondary)] first:pt-0 last:pb-0">
            {guide}
          </p>
        ))}
      </div>
    </Card>
  );
}
export default function MarketIndex({ onOpenDetail, limit = null, showMore = false }) {
  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ['market', 'indices'], queryFn: getMarketIndices });
  const newsQuery = useQuery({ queryKey: ['news', 'market-panel'], queryFn: getNews, enabled: !limit && !showMore });
  const items = useMemo(() => decorateItems(limit ? data.slice(0, limit) : data), [data, limit]);
  const isPage = !limit && !showMore;

  return (
    <section id="market" className="py-7">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {isPage ? <PageHeader eyebrow={t.pageEyebrow} title={t.pageTitle} description={t.pageDescription} /> : <QuoteSectionHeader title={t.title} description={t.description} action={showMore && <Link to="/market" className="text-sm font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">{t.more}</Link>} />}
        {isLoading && <QuoteSkeletonGrid />}
        {error && <SectionState message={t.error} onRetry={refetch} />}
        {!isLoading && !error && (
          items.length === 0 ? <SectionState message={t.empty} /> : (
            <div className="space-y-5">
              {isPage && <MarketOverview items={items} />}
              <Card hover={false} className="p-5">
                {isPage && (
                  <div className="mb-4 flex flex-col gap-2 border-b border-[var(--color-border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-xl font-black tracking-tight text-[var(--color-text-primary)]">주요 지수</h2>
                      <p className="mt-1 text-sm font-semibold leading-6 text-[var(--color-text-secondary)]">지수 카드의 등락률은 전일 또는 24시간 대비 기준입니다.</p>
                    </div>
                    <span className="w-fit rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-black text-[var(--color-primary)]">대표 지수 4개</span>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {items.map((item) => (
                    <QuoteCard
                      key={item.id}
                      title={item.name}
                      subtitle={item.icon}
                      value={item.value}
                      change={item.change}
                      isPositive={item.isPositive}
                      badge="시장 지수"
                      icon={item.icon}
                      description="전일 또는 24시간 대비 지수 등락률"
                      onOpen={() => onOpenDetail?.(item)}
                    />
                  ))}
                </div>
              </Card>
              {isPage && (
                <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1.25fr_0.75fr]">
                  <div className="space-y-5">
                    <MarketRankings items={items} />
                    <RegionComparison items={items} />
                    <MarketGuidePanel />
                  </div>
                  <div className="space-y-5">
                    <TrendPanel items={items} />
                    <Checkpoints />
                    <MarketNewsPanel news={newsQuery.data} />
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </section>
  );
}

























