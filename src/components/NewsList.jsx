import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useSearch } from '../context/SearchContext';
import { getNews } from '../services/api';
import Card from './ui/Card';
import PageHeader from './ui/PageHeader';
import QuoteSectionHeader from './ui/QuoteSectionHeader';
import ResultToolbar from './ui/ResultToolbar';

const t = {
  title: '주요 뉴스',
  description: '시장에 영향을 줄 수 있는 최신 소식을 확인하세요.',
  pageTitle: '뉴스',
  pageDescription: '국내증시, 해외증시, 경제, 암호화폐 소식을 한곳에서 빠르게 확인하세요.',
  empty: '표시할 뉴스가 없습니다.',
  searchEmpty: '검색 결과가 없습니다.',
  more: '더보기',
  error: '뉴스 정보를 불러오지 못했습니다.',
  retry: '다시 시도',
  featured: '주요 뉴스',
};

const sections = [
  { key: 'all', label: '전체' },
  { key: 'domestic', label: '국내증시', accent: 'bg-emerald-500', keywords: ['국내', '한국', '코스피', '코스닥', '삼성', '한국증시'] },
  { key: 'global', label: '해외증시', accent: 'bg-indigo-500', keywords: ['해외', '미국', '나스닥', '다우', 'S&P', 'NASDAQ', 'Dow', '뉴욕'] },
  { key: 'economy', label: '경제', accent: 'bg-amber-500', keywords: ['경제', '금리', '환율', '물가', '정책', '한은', '연준', 'Fed'] },
  { key: 'crypto', label: '암호화폐', accent: 'bg-sky-500', keywords: ['암호화폐', '비트코인', '이더리움', 'BTC', 'ETH', '코인'] },
];

const normalize = (value) => String(value || '').toLowerCase();
const sectionFor = (item) => {
  const haystack = normalize([item.category, item.title, item.summary, item.source].join(' '));
  return sections.find((section) => section.key !== 'all' && section.keywords?.some((keyword) => haystack.includes(normalize(keyword))))?.key || 'domestic';
};

function StatusPanel({ message, onRetry }) {
  return (
    <Card hover={false} className="flex min-h-48 flex-col items-center justify-center p-6 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-[var(--color-primary-soft)] text-sm font-black text-[var(--color-primary)]">i</span>
      <p className="mt-3 text-sm font-bold text-[var(--color-text-secondary)]">{message}</p>
      {onRetry && <button type="button" onClick={onRetry} className="mt-4 rounded-full bg-[var(--color-primary-soft)] px-4 py-2 text-sm font-bold text-[var(--color-primary)] hover:bg-emerald-100">{t.retry}</button>}
    </Card>
  );
}

function NewsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.5fr_0.8fr]">
      {[1, 2].map((item) => (
        <Card key={item} hover={false} className="p-5">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-24 rounded-full bg-slate-100" />
            <div className="h-8 w-3/4 rounded bg-slate-100" />
            <div className="h-4 w-full rounded bg-slate-100" />
            <div className="h-4 w-2/3 rounded bg-slate-100" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function NewsMeta({ item }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {item.category && <span className="rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-xs font-black text-[var(--color-primary)]">{item.category}</span>}
      <span className="text-xs font-bold text-[var(--color-text-tertiary)]">{item.source || '실시간'}</span>
      {item.time && <span className="text-xs font-bold text-[var(--color-text-tertiary)]">{item.time}</span>}
    </div>
  );
}

function NewsItem({ item, featured, onOpen }) {
  return (
    <article className="group relative">
      <button type="button" onClick={() => onOpen?.(item)} className="block w-full rounded-2xl px-3 py-4 text-left transition hover:bg-[var(--color-surface-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <NewsMeta item={item} />
            <h3 className={(featured ? 'text-lg leading-7' : 'text-base leading-6') + ' mt-3 line-clamp-2 font-extrabold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)]'}>{item.title}</h3>
            {item.summary && <p className={(featured ? 'sm:line-clamp-3' : '') + ' mt-2 line-clamp-2 text-sm leading-6 text-[var(--color-text-secondary)]'}>{item.summary}</p>}
          </div>
          {item.image && <img src={item.image} alt={item.title} className="h-24 w-full rounded-2xl object-cover sm:w-32" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
        </div>
      </button>
    </article>
  );
}

function CategoryTabs({ active, counts, onChange }) {
  return (
    <div className="sticky top-20 z-10 flex gap-2 overflow-x-auto rounded-3xl border border-[var(--color-border)] bg-white/95 p-2 shadow-sm backdrop-blur" role="tablist" aria-label="뉴스 분류">
      {sections.map((section) => (
        <button key={section.key} type="button" role="tab" aria-selected={active === section.key} onClick={() => onChange(section.key)} className={(active === section.key ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-background-soft)] text-[var(--color-text-secondary)] hover:bg-emerald-50 hover:text-[var(--color-primary)]') + ' shrink-0 rounded-2xl px-4 py-2 text-sm font-black transition'}>
          {section.label} <span className="ml-1 text-xs opacity-80">{counts[section.key] || 0}</span>
        </button>
      ))}
    </div>
  );
}

function LeadNews({ item, sideItems, onOpenDetail }) {
  if (!item) return null;
  return (
    <Card hover={false} className="overflow-hidden p-0">
      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.9fr]">
        <button type="button" onClick={() => onOpenDetail?.(item)} className="group relative min-h-[320px] bg-white p-7 text-left transition hover:bg-[var(--color-surface-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2">
          <span className="absolute inset-x-7 top-0 h-1 rounded-b-full bg-gradient-to-r from-[var(--color-primary)] via-amber-400 to-rose-400" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs font-black text-[var(--color-primary)] shadow-sm">오늘의 핵심 뉴스</span>
            <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-bold text-[var(--color-text-tertiary)]">{item.category || '뉴스'}</span>
          </div>
          <h2 className="mt-5 line-clamp-3 text-3xl font-black leading-tight tracking-tight text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)]">{item.title}</h2>
          {item.summary && <p className="mt-4 line-clamp-3 max-w-3xl text-sm font-semibold leading-6 text-[var(--color-text-secondary)]">{item.summary}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-black text-[var(--color-text-tertiary)]">
            <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1">{item.source || '실시간'}</span>
            {item.time && <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1">{item.time}</span>}
            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">바로 확인</span>
          </div>
        </button>
        <div className="border-t border-[var(--color-border)] bg-white p-4 lg:border-l lg:border-t-0">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-sm font-black text-[var(--color-text-primary)]">같이 볼 만한 뉴스</p>
            <span className="text-xs font-bold text-[var(--color-text-tertiary)]">흐름 이어보기</span>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {sideItems.map((news) => (
              <button key={news.id} type="button" onClick={() => onOpenDetail?.(news)} className="block w-full rounded-2xl px-2 py-4 text-left hover:bg-[var(--color-surface-muted)]">
                <p className="line-clamp-2 text-sm font-black leading-6 text-[var(--color-text-primary)]">{news.title}</p>
                <p className="mt-1 text-xs font-bold text-[var(--color-text-tertiary)]">{news.category || '뉴스'} · {news.source || '실시간'}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
function MarketBrief({ grouped, counts }) {
  const rows = sections.filter((section) => section.key !== 'all').map((section) => ({ ...section, count: counts[section.key] || 0 }));
  const top = [...rows].sort((a, b) => b.count - a.count)[0];
  return (
    <Card hover={false} className="p-5">
      <p className="text-sm font-extrabold text-[var(--color-text-secondary)]">뉴스 흐름</p>
      <h2 className="mt-2 text-2xl font-black text-[var(--color-text-primary)]">오늘 많이 나온 분야</h2>
      <div className="mt-5 space-y-3">
        {rows.map((row) => (
          <div key={row.key}>
            <div className="flex items-center justify-between text-sm font-black">
              <span className="text-[var(--color-text-primary)]">{row.label}</span>
              <span className="text-[var(--color-text-secondary)]">{row.count}개</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className={'h-full rounded-full ' + row.accent} style={{ width: String(Math.max(8, Math.min(100, (row.count / Math.max(1, grouped.all.length)) * 100))) + '%' }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-semibold leading-6 text-[var(--color-text-secondary)]">지금은 {top?.label || '시장'} 관련 뉴스 비중이 가장 높습니다.</p>
    </Card>
  );
}

function TopIssues({ items, onOpenDetail }) {
  return (
    <Card hover={false} className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-[var(--color-text-secondary)]">이슈 랭킹</p>
          <h2 className="mt-2 text-xl font-black text-[var(--color-text-primary)]">지금 볼 뉴스</h2>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">Top 5</span>
      </div>
      <div className="mt-4 space-y-2">
        {items.slice(0, 5).map((item, index) => (
          <button key={item.id} type="button" onClick={() => onOpenDetail?.(item)} className="flex w-full items-start gap-3 rounded-2xl bg-[var(--color-surface-muted)] px-3 py-3 text-left hover:bg-emerald-50">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-xs font-black text-[var(--color-text-secondary)]">{index + 1}</span>
            <span className="min-w-0">
              <span className="line-clamp-2 text-sm font-black leading-5 text-[var(--color-text-primary)]">{item.title}</span>
              <span className="mt-1 block text-xs font-bold text-[var(--color-text-tertiary)]">{item.category || '뉴스'} · {item.source || '실시간'}</span>
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}

function CategorySection({ section, items, onOpenDetail, compact = false }) {
  if (items.length === 0) return null;
  return (
    <Card hover={false} className="overflow-hidden p-2">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-3">
        <div className="flex items-center gap-2">
          <span className={'h-5 w-1.5 rounded-full ' + (section.accent || 'bg-[var(--color-primary)]')} />
          <h2 className="text-lg font-black text-[var(--color-text-primary)]">{section.label}</h2>
        </div>
        <span className="rounded-full bg-[var(--color-background-soft)] px-3 py-1 text-xs font-black text-[var(--color-text-secondary)]">{items.length}개</span>
      </div>
      <div className={compact ? 'divide-y divide-[var(--color-border)]' : 'grid grid-cols-1 gap-1 md:grid-cols-2'}>
        {items.map((item, index) => <NewsItem key={item.id} item={item} featured={index === 0} onOpen={onOpenDetail} />)}
      </div>
    </Card>
  );
}

export default function NewsList({ onOpenDetail, limit = null, showMore = false, contained = true }) {
  const { query } = useSearch();
  const [activeCategory, setActiveCategory] = useState('all');
  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ['news'], queryFn: getNews });
  const keyword = query.trim().toLowerCase();
  const filtered = data.filter((item) => !keyword || [item.title, item.summary, item.category].join(' ').toLowerCase().includes(keyword));
  const news = limit ? filtered.slice(0, limit) : filtered;
  const isPage = contained && !limit && !showMore;
  const grouped = useMemo(() => {
    const initial = sections.reduce((acc, section) => ({ ...acc, [section.key]: [] }), {});
    news.forEach((item) => { initial[sectionFor(item)].push(item); initial.all.push(item); });
    return initial;
  }, [news]);
  const counts = sections.reduce((acc, section) => ({ ...acc, [section.key]: grouped[section.key]?.length || 0 }), {});
  const visibleNews = activeCategory === 'all' ? grouped.all : grouped[activeCategory] || [];
  const activeSection = sections.find((section) => section.key === activeCategory) || sections[0];
  const lead = grouped.all[0];
  const sideItems = grouped.all.slice(1, 4);

  const content = (
    <>
      {isPage ? <PageHeader eyebrow="콘텐츠" title={t.pageTitle} description={t.pageDescription} /> : <QuoteSectionHeader title={t.title} description={t.description} action={showMore && <Link to="/news" className="text-sm font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">{t.more}</Link>} />}
      {isPage && <ResultToolbar count={news.length} query={query} label="뉴스" />}
      {isLoading && <NewsSkeleton />}
      {error && <StatusPanel message={t.error} onRetry={refetch} />}
      {!isLoading && !error && (
        news.length === 0 ? <StatusPanel message={keyword ? t.searchEmpty : t.empty} /> : (
          isPage ? (
            <div className="space-y-5">
              <LeadNews item={lead} sideItems={sideItems} onOpenDetail={onOpenDetail} />
              <CategoryTabs active={activeCategory} counts={counts} onChange={setActiveCategory} />
              {activeCategory === 'all' ? (
                <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1.45fr_0.75fr]">
                  <div className="space-y-5">
                    {sections.filter((section) => section.key !== 'all').map((section) => <CategorySection key={section.key} section={section} items={(grouped[section.key] || []).slice(0, 4)} onOpenDetail={onOpenDetail} />)}
                  </div>
                  <div className="space-y-5">
                    <MarketBrief grouped={grouped} counts={counts} />
                    <TopIssues items={grouped.all} onOpenDetail={onOpenDetail} />
                  </div>
                </div>
              ) : <CategorySection section={activeSection} items={visibleNews} onOpenDetail={onOpenDetail} compact />}
            </div>
          ) : (
            <Card hover={false} className="p-2"><div className="divide-y divide-[var(--color-border)]">{news.map((item, index) => <NewsItem key={item.id} item={item} featured={index === 0} onOpen={onOpenDetail} />)}</div></Card>
          )
        )
      )}
    </>
  );

  if (!contained) return <section id="news" className="min-w-0">{content}</section>;
  return <section id="news" className="py-7"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{content}</div></section>;
}

