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
  description: '대표 지수의 흐름을 한눈에 확인하세요.',
  pageEyebrow: '시장',
  pageTitle: '시장 지수',
  pageDescription: '국내외 대표 지수의 현재 수치와 등락률을 정리했습니다.',
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
        <Card key={id} hover={false} className="min-h-[150px] p-5">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-24 rounded bg-slate-100" />
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
  const strongest = [...items].sort((a, b) => Math.abs(b.changeValue) - Math.abs(a.changeValue))[0];
  const avg = average(items.map((item) => item.changeValue));
  const mood = rising >= falling ? '상승 우세' : '하락 우세';

  return (
    <Card hover={false} className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black text-[var(--color-primary)]">시장 요약</p>
          <h2 className="mt-2 text-2xl font-black text-[var(--color-text-primary)]">오늘 시장은 {mood}입니다</h2>
          <p className="mt-2 text-sm font-semibold text-[var(--color-text-secondary)]">표시 중인 대표 지수 {items.length}개의 등락률을 기준으로 계산했습니다.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[520px]">
          <SummaryChip label="상승" value={rising} tone="up" />
          <SummaryChip label="하락" value={falling} tone="down" />
          <SummaryChip label="평균" value={formatPercent(avg)} tone={avg >= 0 ? 'up' : 'down'} />
          <SummaryChip label="변동 큰 지수" value={strongest?.icon || '-'} />
        </div>
      </div>
    </Card>
  );
}

function SummaryChip({ label, value, tone }) {
  const toneClass = tone === 'up' ? 'text-red-500 bg-red-50' : tone === 'down' ? 'text-blue-600 bg-blue-50' : 'text-[var(--color-text-primary)] bg-[var(--color-background-soft)]';
  return (
    <div className={'rounded-xl px-4 py-3 ' + toneClass}>
      <p className="text-xs font-black opacity-75">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function RankingList({ title, items, tone }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white">
      <h3 className="border-b border-[var(--color-border)] px-4 py-3 text-sm font-black text-[var(--color-text-primary)]">{title}</h3>
      <div className="divide-y divide-[var(--color-border)]">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--color-background-soft)] text-xs font-black text-[var(--color-primary)]">{index + 1}</span>
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
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-4">
        <div>
          <p className="text-sm font-extrabold text-[var(--color-text-secondary)]">등락률 기준</p>
          <h2 className="mt-1 text-xl font-black text-[var(--color-text-primary)]">상승/하락 지수</h2>
        </div>
        <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-black text-[var(--color-primary)]">전일 또는 24시간</span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RankingList title="상승률 상위" items={gainers} tone="up" />
        <RankingList title="하락률 상위" items={losers} tone="down" />
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
        <span className={value >= 0 ? 'text-red-500' : 'text-blue-600'}>{formatPercent(value)} / {count}개</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
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
      <p className="text-sm font-extrabold text-[var(--color-text-secondary)]">지역 비교</p>
      <h2 className="mt-2 text-xl font-black text-[var(--color-text-primary)]">미국 지수 vs 한국 지수</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">표시 중인 지수를 지역별로 나눠 평균 등락률을 비교합니다.</p>
      <div className="mt-5 space-y-4">
        <ComparisonBar label="미국 지수" value={usAverage} count={usItems.length} />
        <ComparisonBar label="한국 지수" value={krAverage} count={krItems.length} />
      </div>
      <p className="mt-5 rounded-xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-semibold leading-6 text-[var(--color-text-secondary)]">현재 기준으로는 {leader} 흐름이 더 강합니다.</p>
    </Card>
  );
}

function TrendPanel({ items }) {
  const points = items.map((item, index) => {
    const x = 28 + index * (244 / Math.max(1, items.length - 1));
    const y = 92 - Math.max(-5, Math.min(5, item.changeValue)) * 10;
    return { x, y, item };
  });
  const path = points.map((point, index) => (index === 0 ? 'M ' : 'L ') + point.x + ' ' + point.y).join(' ');

  return (
    <Card hover={false} className="p-5">
      <p className="text-sm font-extrabold text-[var(--color-text-secondary)]">시장 흐름</p>
      <h2 className="mt-2 text-xl font-black text-[var(--color-text-primary)]">지수 등락률 비교</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">가격 차트가 아니라 각 지수의 오늘 등락률을 같은 기준으로 비교한 그래프입니다.</p>
      <div className="mt-5 rounded-xl border border-[var(--color-border)] bg-gradient-to-b from-white to-sky-50/40 p-4">
        <svg viewBox="0 0 300 150" role="img" aria-label="지수별 등락률 비교 그래프" className="h-64 w-full">
          <line x1="18" y1="92" x2="282" y2="92" stroke="#cbd5e1" strokeWidth="2" />
          <line x1="18" y1="62" x2="282" y2="62" stroke="#e2e8f0" strokeWidth="1" />
          <line x1="18" y1="122" x2="282" y2="122" stroke="#e2e8f0" strokeWidth="1" />
          <path d={path + ' L ' + points[points.length - 1]?.x + ' 138 L ' + points[0]?.x + ' 138 Z'} fill="rgba(14,165,233,0.12)" />
          <path d={path} fill="none" stroke="#0ea5e9" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((point) => (
            <g key={point.item.id}>
              <circle cx={point.x} cy={point.y} r="5" fill="white" stroke="#0ea5e9" strokeWidth="4" />
              <text x={point.x} y="144" textAnchor="middle" className="fill-slate-500 text-[10px] font-bold">{point.item.icon}</text>
            </g>
          ))}
        </svg>
      </div>
    </Card>
  );
}

function MarketNewsPanel({ news }) {
  const items = (news || []).slice(0, 5);
  return (
    <Card hover={false} className="p-5">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
        <h2 className="text-lg font-black text-[var(--color-text-primary)]">시장 뉴스</h2>
        <Link to="/news" className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 hover:bg-amber-100">{t.more}</Link>
      </div>
      <div className="divide-y divide-[var(--color-border)]">
        {items.map((item) => (
          <Link key={item.id} to={'/detail/news/' + item.id} state={{ item }} className="block py-3 first:pt-4 last:pb-0">
            <p className="line-clamp-2 text-sm font-black leading-5 text-[var(--color-text-primary)]">{item.title}</p>
            <p className="mt-1 line-clamp-1 text-xs font-semibold text-[var(--color-text-secondary)]">{item.category || '시장'} / {item.source || '실시간'}</p>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function MarketGuidePanel() {
  const guides = [
    '지수는 개별 종목 추천이 아니라 시장 전체 방향을 보는 참고 정보입니다.',
    '미국 지수와 한국 지수를 함께 보면 지역별 분위기를 비교하기 쉽습니다.',
    '상승/하락 수치는 전일 또는 24시간 등락률 기준으로 표시됩니다.',
  ];

  return (
    <Card hover={false} className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-[var(--color-text-secondary)]">확인 기준</p>
          <h2 className="mt-2 text-xl font-black text-[var(--color-text-primary)]">이렇게 보세요</h2>
        </div>
        <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-black text-[var(--color-primary)]">참고</span>
      </div>
      <div className="mt-4 divide-y divide-[var(--color-border)]">
        {guides.map((guide) => <p key={guide} className="py-3 text-sm font-semibold leading-6 text-[var(--color-text-secondary)] first:pt-0 last:pb-0">{guide}</p>)}
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
                  <div className="mb-4 flex items-end justify-between gap-3 border-b border-[var(--color-border)] pb-4">
                    <div>
                      <h2 className="text-xl font-black tracking-tight text-[var(--color-text-primary)]">대표 지수</h2>
                      <p className="mt-1 text-sm font-semibold leading-6 text-[var(--color-text-secondary)]">전일 또는 24시간 대비 등락률 기준입니다.</p>
                    </div>
                    <span className="rounded-full bg-[var(--color-background-soft)] px-3 py-1 text-xs font-black text-[var(--color-text-secondary)]">{items.length}개</span>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {items.map((item) => (
                    <QuoteCard key={item.id} title={item.name} subtitle={item.icon} value={item.value} change={item.change} isPositive={item.isPositive} badge="시장 지수" icon={item.icon} description="전일 또는 24시간 대비 등락률" onOpen={() => onOpenDetail?.(item)} />
                  ))}
                </div>
              </Card>
              {isPage && (
                <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1.35fr_0.75fr]">
                  <div className="space-y-5">
                    <TrendPanel items={items} />
                    <MarketRankings items={items} />
                  </div>
                  <div className="space-y-5">
                    <RegionComparison items={items} />
                    <MarketGuidePanel />
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
