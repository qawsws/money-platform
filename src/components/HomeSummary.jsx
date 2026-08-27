import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAnnouncements, getCommunityPosts, getCryptoPrices, getKoreanStocks, getMarketIndices, getNews, getPortfolio, getUsStocks } from '../services/api';

const t = {
  greeting: '시장 흐름을 한눈에 확인하세요',
  dashboard: '오늘의 시장',
  subtitle: '주요 지수, 미국 주식, 한국 주식, 암호화폐, 시장 뉴스를 한 화면에서 확인하세요.',
  totalAssets: '확인 자산',
  breadth: '시장 등락',
  performance: '시장별 등락 분포',
  allocation: '자산군 비중',
  watchlist: '변동률 랭킹',
  watchlistHint: '오늘 등락폭이 큰 자산 순',
  heroHint: '시장별 주요 자산',
  news: '주요 뉴스',
  ai: 'AI 투자 인사이트',
  aiText: '보유 자산과 관련 뉴스, 시장 데이터를 연결해 확인할 점을 정리합니다.',
  portfolio: '포트폴리오에서 보기',
  refresh: '새로고침',
  refreshing: '업데이트 중',
  updatedNow: '현재 데이터 기준',
  empty: '표시할 시장 데이터가 없습니다.',
  error: '시장 정보를 불러오지 못했습니다.',
  retry: '다시 시도',
  noData: '데이터 없음',
  viewAll: '더보기',
  community: '커뮤니티',
  notices: '공지',
  noticeHint: '중요한 공지를 제목으로 먼저 확인하세요',
  noticeEmpty: '현재 등록된 공지가 없습니다.',
  viewNotice: '내용 보기',
  close: '닫기',
  loginPortfolioTitle: '내 자산 비중은 로그인 후 확인할 수 있어요',
  loginPortfolioText: '포트폴리오에 보유 자산을 추가하면 자산군별 비중을 볼 수 있습니다.',
};

const USD_TO_KRW_RATE = 1380;
const parseChange = (item) => Number.parseFloat(String(item?.change || '').replace('%', '').replace('+', ''));
const parsePrice = (value) => Number(String(value ?? '').replace(/[^0-9.-]/g, '')) || 0;
const token = () => localStorage.getItem('mp_token') || '';
const isAssetPositive = (item) => Boolean(item?.isPositive) || parseChange(item) >= 0;

const compactAsset = (item, group, type) => ({
  ...item,
  group,
  type,
  title: item?.name || item?.symbol || '-',
  symbol: item?.symbol || item?.icon || item?.id || '-',
  price: item?.price || item?.value || '-',
  changeValue: parseChange(item),
  positive: isAssetPositive(item),
});

const uniqueAssets = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item) return false;
    const key = `${item.type}-${item.symbol}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const selectMarketRepresentativeAssets = ({ usItems, krItems, cryptoItems }) => uniqueAssets([
  usItems[0],
  usItems[1],
  krItems[0],
  krItems[1],
  cryptoItems[0],
  cryptoItems[1],
  ...usItems,
  ...krItems,
  ...cryptoItems,
]).slice(0, 5);

const formatUpdatedAt = (timestamp) => {
  if (!timestamp) return t.updatedNow;
  return `${new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(timestamp))} 기준`;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function RefreshIcon({ spinning }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`size-4 ${spinning ? 'animate-spin' : ''}`}>
      <path d="M20 12a8 8 0 0 1-13.7 5.6M4 12A8 8 0 0 1 17.7 6.4M18 3v4h-4M6 21v-4h4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function MiniSpark({ positive }) {
  const stroke = positive ? '#ef4444' : '#2563eb';
  const points = positive ? '0,18 12,13 25,15 38,8 50,11 63,6 76,10 90,4' : '0,5 12,9 25,7 38,14 50,11 63,18 76,15 90,21';
  return <svg viewBox="0 0 90 24" className="h-7 w-20" aria-hidden="true"><polyline points={points} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ChangeText({ item }) {
  return <span className={`text-xs font-black ${item.positive ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'}`}>{item.change || '-'}</span>;
}

function DashboardSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="animate-pulse rounded-[28px] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
        <div className="grid gap-4 lg:grid-cols-[190px_minmax(0,1fr)]">
          <div className="hidden min-h-[640px] rounded-2xl bg-slate-100 lg:block" />
          <div className="space-y-4">
            <div className="h-16 rounded-2xl bg-slate-100" />
            <div className="h-24 rounded-2xl bg-slate-100" />
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_330px]"><div className="h-96 rounded-2xl bg-slate-100" /><div className="h-96 rounded-2xl bg-slate-100" /></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Sidebar({ counts }) {
  const items = [
    { label: '홈', icon: 'H', to: '/' },
    { label: '시장', icon: 'M', to: '/market' },
    { label: '포트폴리오', icon: 'P', to: '/portfolio' },
    { label: '뉴스', icon: 'N', to: '/news' },
    { label: '커뮤니티', icon: 'C', to: '/community' },
  ];
  return (
    <aside className="hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-background-soft)] p-4 lg:block">
      <div className="flex items-center gap-3 px-2 py-2">
        <span className="grid size-10 place-items-center rounded-2xl bg-[var(--color-primary)] text-sm font-black text-white">MP</span>
        <div><p className="text-sm font-black text-[var(--color-text-primary)]">MoneyPlatform</p><p className="text-xs font-semibold text-[var(--color-text-secondary)]">{'투자 정보 플랫폼'}</p></div>
      </div>
      <nav className="mt-8 space-y-1" aria-label="Dashboard sections">
        {items.map((item, index) => (
          <Link key={item.label} to={item.to} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold hover:bg-white hover:text-[var(--color-primary)] hover:shadow-sm ${index === 0 ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-secondary)]'}`}>
            <span className="grid size-7 place-items-center rounded-xl bg-[var(--color-primary-soft)] text-xs text-[var(--color-primary)]">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-8 rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-xs font-bold text-[var(--color-text-secondary)]">{'확인 자산'}</p>
        <p className="mt-2 text-3xl font-black tabular-nums text-[var(--color-text-primary)]">{counts.total}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold">
          <span className="rounded-xl bg-[var(--color-positive-soft)] px-2 py-2 text-[var(--color-positive)]">{'상승'} {counts.positive}</span>
          <span className="rounded-xl bg-[var(--color-negative-soft)] px-2 py-2 text-[var(--color-negative)]">{'하락'} {counts.negative}</span>
        </div>
      </div>
    </aside>
  );
}

function TickerBar({ items, onOpen }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
      <div className="flex overflow-x-auto px-2 py-2">
        {items.map((item) => (
          <button key={`${item.type}-${item.symbol}`} type="button" aria-label={`Open ${item.type} market detail`} onClick={() => onOpen(item)} className="flex min-w-max items-center gap-2 rounded-xl px-3 py-2 hover:bg-[var(--color-background-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
            <span className="size-2 rounded-full bg-[var(--color-text-primary)]" />
            <span className="text-xs font-black text-[var(--color-text-primary)]">{item.symbol}</span>
            <ChangeText item={item} />
          </button>
        ))}
      </div>
    </div>
  );
}

function NoticePanel({ items, selected, onSelect, onClose }) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-amber-500" />
            <h2 className="text-base font-black text-[var(--color-text-primary)]">{t.notices}</h2>
          </div>
          <p className="mt-1 text-xs font-bold text-amber-800">{t.noticeHint}</p>
        </div>
      </div>
      <div className="mt-3 grid gap-2 lg:grid-cols-2">
        {items.length === 0 ? (
          <p className="rounded-2xl bg-white/70 px-3 py-3 text-sm font-bold text-[var(--color-text-secondary)]">{t.noticeEmpty}</p>
        ) : items.map((notice) => (
          <button
            key={notice.id}
            type="button"
            onClick={() => onSelect(notice)}
            className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-2xl bg-white px-3 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-black ${notice.priority === 'important' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-800'}`}>
              {notice.priority === 'important' ? '중요' : '공지'}
            </span>
            <span className="min-w-0 truncate text-sm font-black text-[var(--color-text-primary)]">{notice.title}</span>
            <span className="shrink-0 text-xs font-black text-amber-700">{t.viewNotice}</span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="home-notice-title">
          <article className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-black ${selected.priority === 'important' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-800'}`}>
                  {selected.priority === 'important' ? '중요' : '공지'}
                </span>
                <h2 id="home-notice-title" className="mt-3 break-words text-xl font-black text-[var(--color-text-primary)]">{selected.title}</h2>
              </div>
              <button type="button" onClick={onClose} className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-bold text-[var(--color-text-secondary)] hover:bg-slate-50">
                {t.close}
              </button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto px-5 py-5">
              <p className="whitespace-pre-line break-words text-sm leading-7 text-[var(--color-text-secondary)]">{selected.content}</p>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
function AssetHeroCard({ item, onOpen }) {
  if (!item) return null;
  const accent = item.positive ? '#16a34a' : '#2563eb';
  return (
    <button type="button" aria-label={`Open ${item.type} featured detail`} onClick={() => onOpen(item)} className="min-w-[220px] rounded-2xl border border-[var(--color-border)] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" style={{ borderTop: `3px solid ${accent}` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="truncate text-sm font-black text-[var(--color-text-primary)]">{item.title}</p><p className="text-xs font-bold text-[var(--color-text-secondary)]">{item.symbol}</p></div>
        <span className="rounded-full bg-[var(--color-background-soft)] px-2 py-1 text-xs font-black text-[var(--color-text-secondary)]">{item.group}</span>
      </div>
      <div className="mt-5 flex items-end justify-between gap-4">
        <div><p className="text-xs font-bold text-[var(--color-text-secondary)]">{'현재가'}</p><p className="mt-1 text-2xl font-black tabular-nums text-[var(--color-text-primary)]">{item.price}</p></div>
        <MiniSpark positive={item.positive} />
      </div>
    </button>
  );
}

function SummaryCard({ total, positive, negative, topGainers, topLosers }) {
  const positiveWidth = total ? clamp((positive / total) * 100, 0, 100) : 0;
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <p className="text-sm font-black text-[var(--color-text-secondary)]">{t.breadth}</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <div><p className="text-4xl font-black tabular-nums text-[var(--color-text-primary)]">{total}</p><p className="mt-1 text-xs font-bold text-[var(--color-text-secondary)]">{t.totalAssets}</p></div>
        <div className="text-right"><p className="text-sm font-black text-[var(--color-positive)]">{'상승'} {positive}</p><p className="mt-1 text-sm font-black text-[var(--color-negative)]">{'하락'} {negative}</p></div>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-[var(--color-negative-soft)]"><div className="h-full bg-[var(--color-positive)]" style={{ width: positiveWidth + '%' }} /></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <RankList title={'상승 TOP 5'} items={topGainers} positive />
        <RankList title={'하락 TOP 5'} items={topLosers} />
      </div>
    </section>
  );
}

function RankList({ title, items, positive = false }) {
  return (
    <div className="rounded-2xl bg-[var(--color-background-soft)] p-3">
      <p className="text-xs font-black text-[var(--color-text-secondary)]">{title}</p>
      <div className="mt-2 space-y-2">
        {items.length === 0 ? <p className="py-2 text-xs font-bold text-[var(--color-text-secondary)]">{t.noData}</p> : items.map((item, index) => (
          <div key={title + '-' + item.type + '-' + item.symbol} className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-2 text-xs">
            <span className="grid size-5 place-items-center rounded-full bg-white font-black text-[var(--color-text-secondary)]">{index + 1}</span>
            <div className="min-w-0"><p className="truncate font-black text-[var(--color-text-primary)]">{item.symbol}</p><p className="truncate font-bold text-[var(--color-text-secondary)]">{item.group}</p></div>
            <span className={(positive ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]') + ' font-black'}>{item.change}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartPanel({ groups }) {
  const rows = groups.map((group) => {
    const positive = group.items.filter((item) => item.positive).length;
    const negative = group.items.filter((item) => !item.positive).length;
    const total = group.items.length;
    return {
      ...group,
      positive,
      negative,
      total,
      positiveWidth: total ? clamp((positive / total) * 100, 0, 100) : 0,
      negativeWidth: total ? clamp((negative / total) * 100, 0, 100) : 0,
    };
  });
  const total = rows.reduce((sum, row) => sum + row.total, 0);

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-[var(--color-text-secondary)]">{t.performance}</p>
          <h2 className="mt-2 text-2xl font-black text-[var(--color-text-primary)]">{'시장군별 상승/하락 비교'}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-text-secondary)]">{'지수·주식은 전일 종가 대비, 암호화폐는 24시간 변동률 기준입니다.'}</p>
        </div>
        <div className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-[var(--color-text-secondary)] sm:block">{'총'} {total}{'개'}</div>
      </div>
      <div className="mt-5 space-y-4">
        {rows.map((row) => (
          <div key={row.label} className="rounded-2xl bg-[var(--color-background-soft)] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-[var(--color-text-primary)]">{row.label}</p>
              <p className="text-xs font-black text-[var(--color-text-secondary)]">{'하락'} {row.negative}{'개'} / {'상승'} {row.positive}{'개'}</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <div className="h-3 overflow-hidden rounded-full bg-white"><div className="ml-auto h-full rounded-full bg-[var(--color-negative)]" style={{ width: row.negativeWidth + '%' }} /></div>
                <div className="mt-1 flex justify-between text-[11px] font-bold text-[var(--color-negative)]"><span>{'하락'}</span><span>{row.negativeWidth.toFixed(0)}%</span></div>
              </div>
              <div>
                <div className="h-3 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[var(--color-positive)]" style={{ width: row.positiveWidth + '%' }} /></div>
                <div className="mt-1 flex justify-between text-[11px] font-bold text-[var(--color-positive)]"><span>{'상승'}</span><span>{row.positiveWidth.toFixed(0)}%</span></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Watchlist({ title, items, onOpen, to, description }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-black text-[var(--color-text-primary)]">{title}</h2>
          {description && <p className="mt-1 text-xs font-bold text-[var(--color-text-secondary)]">{description}</p>}
        </div>
        {to && <Link to={to} className="shrink-0 rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-black text-[var(--color-primary)]">{t.viewAll}</Link>}
      </div>
      <div className="mt-3 divide-y divide-[var(--color-border)]">
        {items.length === 0 ? <p className="py-8 text-sm font-bold text-[var(--color-text-secondary)]">{t.noData}</p> : items.map((item, index) => (
          <button key={`${item.type}-${item.symbol}`} type="button" aria-label={`Open ${item.type} watch item`} onClick={() => onOpen(item)} className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-2 py-3 text-left hover:bg-[var(--color-background-soft)]">
            <span className="grid size-7 place-items-center rounded-full bg-slate-100 text-xs font-black text-[var(--color-text-secondary)]">{index + 1}</span>
            <div className="min-w-0"><p className="truncate text-sm font-black text-[var(--color-text-primary)]">{item.title}</p><p className="text-xs font-bold text-[var(--color-text-secondary)]">{item.symbol} / {item.group}</p></div>
            <div className="text-right"><p className="text-sm font-black tabular-nums text-[var(--color-text-primary)]">{item.price}</p><ChangeText item={item} /></div>
          </button>
        ))}
      </div>
    </section>
  );
}

function Allocation({ groups, totalValue, holdingCount, loading }) {
  const safeTotal = totalValue || groups.reduce((sum, group) => sum + group.value, 0) || 1;
  const gradient = groups.reduce((acc, group) => {
    const startAt = acc.cursor;
    const endAt = acc.cursor + (group.value / safeTotal) * 100;
    return { cursor: endAt, parts: [...acc.parts, group.hex + ' ' + startAt + '% ' + endAt + '%'] };
  }, { cursor: 0, parts: [] }).parts.join(', ');

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-xs font-black uppercase text-emerald-700">Portfolio</p><h2 className="mt-1 text-base font-black text-[var(--color-text-primary)]">{'내 자산군 비중'}</h2></div>
        <span className="rounded-full bg-[var(--color-background-soft)] px-2.5 py-1 text-xs font-black text-[var(--color-text-secondary)]">{holdingCount}{'개'}</span>
      </div>
      {loading ? (
        <div className="mt-5 space-y-3"><div className="h-32 animate-pulse rounded-2xl bg-slate-100" /><div className="h-12 animate-pulse rounded-2xl bg-slate-100" /></div>
      ) : groups.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-background-soft)] p-4">
          <p className="text-sm font-black text-[var(--color-text-primary)]">{'등록된 보유 자산이 없어요'}</p>
          <p className="mt-2 text-xs font-semibold leading-5 text-[var(--color-text-secondary)]">{'포트폴리오에 자산을 추가하면 평가금액 기준 비중이 표시됩니다.'}</p>
          <Link to="/portfolio" className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-full bg-emerald-700 px-4 text-sm font-black text-white hover:bg-emerald-800">{'자산 추가하기'}</Link>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
            <div className="grid size-28 place-items-center rounded-full shadow-inner" style={{ background: 'conic-gradient(' + (gradient || '#e5e7eb 0% 100%') + ')' }}>
              <div className="grid size-20 place-items-center rounded-full bg-white text-center shadow-sm">
                <div><p className="text-[11px] font-bold text-[var(--color-text-secondary)]">{'평가금액'}</p><p className="text-lg font-black text-[var(--color-text-primary)]">100%</p></div>
              </div>
            </div>
            <div className="space-y-2">
              {groups.map((group) => {
                const percent = Math.round((group.value / safeTotal) * 100);
                return (
                  <div key={group.label}>
                    <div className="mb-1 flex items-center justify-between text-xs font-black"><span className="flex items-center gap-2 text-[var(--color-text-secondary)]"><span className="size-2.5 rounded-full" style={{ backgroundColor: group.hex }} />{group.label}</span><span className="text-[var(--color-text-primary)]">{percent}%</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--color-background-soft)]"><div className="h-full rounded-full" style={{ width: percent + '%', backgroundColor: group.hex }} /></div>
                    <p className="mt-1 text-[11px] font-bold text-[var(--color-text-tertiary)]">{group.count}{'개'} / {group.formatted}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <Link to="/portfolio" className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-full bg-emerald-700 px-4 text-sm font-black text-white hover:bg-emerald-800">{'포트폴리오에서 자세히 보기'}</Link>
        </>
      )}
    </section>
  );
}
function NewsPanel({ items, onOpen }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
        <div className="flex items-center gap-2"><span className="h-5 w-1 rounded-full bg-amber-500" /><h2 className="text-base font-black text-[var(--color-text-primary)]">{t.news}</h2></div>
        <Link to="/news" className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-black text-amber-700">{t.viewAll}</Link>
      </div>
      <div className="mt-2 divide-y divide-[var(--color-border)]">
        {items.length === 0 ? <p className="py-8 text-sm font-bold text-[var(--color-text-secondary)]">{t.noData}</p> : items.map((item) => (
          <button key={item.id} type="button" onClick={() => onOpen(item)} className="block w-full rounded-xl px-2 py-3 text-left hover:bg-amber-50/70">
            <p className="text-xs font-black text-amber-700">{item.category || '뉴스'} {item.time ? `/ ${item.time}` : ''}</p>
            <p className="mt-1 line-clamp-2 text-sm font-black leading-6 text-[var(--color-text-primary)]">{item.title}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function PortfolioLoginPrompt() {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase text-emerald-700">Portfolio</p>
      <h2 className="mt-2 text-lg font-black leading-7 text-[var(--color-text-primary)]">{'내 자산 비중은 로그인 후 확인할 수 있어요'}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{'보유 자산을 등록하면 평가금액 기준으로 한국 주식, 미국 주식, 암호화폐 비중을 볼 수 있습니다.'}</p>
      <div className="mt-5 space-y-2">
        {['평가금액 기준 비중', '자산군별 보유 개수', '수익/손실 확인'].map((item) => <p key={item} className="rounded-2xl bg-[var(--color-background-soft)] px-3 py-2 text-xs font-black text-[var(--color-text-secondary)]">{item}</p>)}
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        <Link to="/portfolio" className="inline-flex h-10 items-center justify-center rounded-full bg-emerald-700 px-4 text-sm font-black text-white hover:bg-emerald-800">{'포트폴리오 보기'}</Link>
        <Link to="/favorites" className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--color-border)] px-4 text-sm font-black text-[var(--color-text-primary)] hover:bg-[var(--color-background-soft)]">{'관심자산 보기'}</Link>
      </div>
    </section>
  );
}

function CommunityPanel({ items }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
        <div className="flex items-center gap-2"><span className="h-5 w-1 rounded-full bg-emerald-500" /><h2 className="text-base font-black text-[var(--color-text-primary)]">{t.community}</h2></div>
        <Link to="/community" className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{t.viewAll}</Link>
      </div>
      <div className="mt-2 divide-y divide-[var(--color-border)]">
        {items.length === 0 ? <p className="py-8 text-sm font-bold text-[var(--color-text-secondary)]">{t.noData}</p> : items.map((item) => (
          <Link key={item.id} to="/community" className="block rounded-xl px-2 py-3 hover:bg-emerald-50/70">
            <p className="text-xs font-black text-emerald-700">{item.category || '자유'} / {item.authorName || item.author || '익명'}</p>
            <p className="mt-1 line-clamp-2 text-sm font-black leading-6 text-[var(--color-text-primary)]">{item.title}</p>
            <p className="mt-1 text-xs font-bold text-[var(--color-text-secondary)]">{'조회'} {item.views || 0} / {'댓글'} {item.comments || item.commentCount || 0}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function AiPanel() {
  return (
    <section className="rounded-3xl bg-[var(--color-text-primary)] p-5 text-white shadow-sm">
      <p className="text-xs font-black uppercase text-emerald-200">{t.ai}</p>
      <h2 className="mt-2 text-xl font-black">{'투자 점검'}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">{t.aiText}</p>
      <Link to="/portfolio" className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-white px-4 text-sm font-black text-[var(--color-text-primary)]">{t.portfolio}</Link>
    </section>
  );
}

export default function HomeSummary({ onOpenDetail }) {
  const { user } = useAuth();
  const [selectedNotice, setSelectedNotice] = useState(null);
  const market = useQuery({ queryKey: ['market', 'indices'], queryFn: getMarketIndices });
  const crypto = useQuery({ queryKey: ['crypto'], queryFn: getCryptoPrices });
  const stocks = useQuery({ queryKey: ['stocks', 'us'], queryFn: getUsStocks });
  const koreanStocks = useQuery({ queryKey: ['stocks', 'kr'], queryFn: getKoreanStocks });
  const news = useQuery({ queryKey: ['news'], queryFn: getNews });
  const community = useQuery({ queryKey: ['community', 'home'], queryFn: getCommunityPosts });
  const announcements = useQuery({ queryKey: ['announcements'], queryFn: getAnnouncements });
  const portfolio = useQuery({ queryKey: ['portfolio'], queryFn: () => getPortfolio(token()), enabled: Boolean(user) });
  const queries = [market, crypto, stocks, koreanStocks, news];
  const isLoading = queries.some((query) => query.isLoading);
  const isFetching = queries.some((query) => query.isFetching);
  const error = queries.find((query) => query.error)?.error;
  const updatedAt = Math.max(...queries.map((query) => query.dataUpdatedAt || 0));

  const indices = (market.data || []).map((item) => compactAsset(item, '지수', 'market'));
  const cryptoItems = (crypto.data || []).map((item) => compactAsset(item, '암호화폐', 'crypto'));
  const usItems = (stocks.data || []).map((item) => compactAsset(item, '미국 주식', 'stock'));
  const krItems = (koreanStocks.data || []).map((item) => compactAsset(item, '한국 주식', 'korean-stock'));
  const quoteAssets = [...cryptoItems, ...usItems, ...krItems];
  const assets = [...indices, ...quoteAssets].filter((item) => Number.isFinite(item.changeValue));
  const positive = assets.filter((item) => item.positive).length;
  const negative = assets.filter((item) => !item.positive).length;
  const topGainers = assets.filter((item) => item.changeValue >= 0).sort((a, b) => b.changeValue - a.changeValue).slice(0, 5);
  const topLosers = assets.filter((item) => item.changeValue < 0).sort((a, b) => a.changeValue - b.changeValue).slice(0, 5);
  const heroAssets = selectMarketRepresentativeAssets({ usItems, krItems, cryptoItems });
  const tickerItems = indices.slice(0, 4);
  const watchItems = [...usItems, ...cryptoItems, ...krItems].sort((a, b) => Math.abs(b.changeValue) - Math.abs(a.changeValue)).slice(0, 5);
  const noticeItems = (announcements.data || []).slice(0, 3);
  const breadthGroups = [
    { label: '지수', items: indices },
    { label: '미국 주식', items: usItems },
    { label: '한국 주식', items: krItems },
    { label: '암호화폐', items: cryptoItems },
  ].filter((group) => group.items.length > 0);
  const assetByKey = new Map(quoteAssets.map((item) => [`${item.type}:${item.id}`, item]));
  const portfolioHoldings = portfolio.data?.holdings || [];
  const portfolioTotals = portfolioHoldings.reduce((acc, holding) => {
    const current = assetByKey.get(holding.itemKey);
    const type = holding.assetType || String(holding.itemKey || '').split(':')[0];
    const label = type === 'korean-stock' ? '한국 주식' : type === 'stock' ? '미국 주식' : '암호화폐';
    const currentPrice = parsePrice(current?.price);
    const fallbackPrice = Number(holding.averagePrice) || 0;
    const price = currentPrice || fallbackPrice;
    const value = Number(holding.quantity || 0) * price * (type === 'korean-stock' ? 1 : USD_TO_KRW_RATE);
    const previous = acc.get(label) || { label, value: 0, count: 0 };
    acc.set(label, { ...previous, value: previous.value + value, count: previous.count + 1 });
    return acc;
  }, new Map());
  const portfolioColors = { '한국 주식': '#10b981', '미국 주식': '#8b5cf6', '암호화폐': '#f59e0b' };
  const portfolioGroups = [...portfolioTotals.values()].filter((group) => group.value > 0).map((group) => ({ ...group, hex: portfolioColors[group.label] || '#64748b', formatted: `₩${Math.round(group.value).toLocaleString('ko-KR')}` }));
  const portfolioTotalValue = portfolioGroups.reduce((sum, group) => sum + group.value, 0);

  const refetchAll = () => queries.forEach((query) => query.refetch());
  const openAsset = (item) => onOpenDetail?.(item.type, item);
  const openNews = (item) => onOpenDetail?.('news', item);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <section className="mx-auto max-w-7xl px-3 py-5 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-[var(--color-border)] bg-white p-3 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
        <div className="grid gap-4 lg:grid-cols-[210px_minmax(0,1fr)]">
          <Sidebar counts={{ total: assets.length, positive, negative }} />
          <main className="min-w-0 space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-5 py-5 shadow-sm md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase text-[var(--color-primary)]">{t.dashboard}</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-[var(--color-text-primary)] sm:text-3xl">{t.greeting}</h1>
                <p className="mt-1 text-sm font-semibold text-[var(--color-text-secondary)]">{error ? String(error?.message || error) : t.subtitle}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-[var(--color-background-soft)] px-3 py-2 text-xs font-bold text-[var(--color-text-secondary)]">{formatUpdatedAt(updatedAt)}</span>
                <button type="button" onClick={refetchAll} disabled={isFetching} aria-label={isFetching ? t.refreshing : t.refresh} className="grid size-10 place-items-center rounded-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"><RefreshIcon spinning={isFetching} /></button>
              </div>
            </div>

            <NoticePanel items={noticeItems} selected={selectedNotice} onSelect={setSelectedNotice} onClose={() => setSelectedNotice(null)} />

            {tickerItems.length > 0 && <TickerBar items={tickerItems} onOpen={openAsset} />}

            {error ? (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5"><p className="font-bold text-amber-800">{t.error}</p><button type="button" onClick={refetchAll} className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-bold text-amber-800 shadow-sm">{t.retry}</button></div>
            ) : assets.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[var(--color-border)] bg-white p-8 text-center text-sm font-bold text-[var(--color-text-secondary)]">{t.empty}</div>
            ) : (
              <>
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-soft)] p-3"><div className="mb-3 flex items-center justify-between gap-3 px-1"><p className="text-sm font-black text-[var(--color-text-primary)]">{'시장별 주요 자산'}</p><span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[var(--color-text-secondary)] shadow-sm">{t.heroHint}</span></div><div className="flex gap-3 overflow-x-auto pb-1">{heroAssets.map((item) => <AssetHeroCard key={`${item.type}-${item.symbol}`} item={item} onOpen={openAsset} />)}</div></div>
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_340px]">
                  <div className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]"><SummaryCard total={assets.length} positive={positive} negative={negative} topGainers={topGainers} topLosers={topLosers} /><ChartPanel groups={breadthGroups} /></div>
                    <div className="grid gap-4 lg:grid-cols-2"><Watchlist title={'미국 주식'} items={usItems.slice(0, 5)} onOpen={openAsset} to="/stocks/us" /><Watchlist title={'한국 주식'} items={krItems.slice(0, 5)} onOpen={openAsset} to="/stocks/kr" /></div>
                    <div className="grid gap-4 lg:grid-cols-2"><NewsPanel items={(news.data || []).slice(0, 4)} onOpen={openNews} /><CommunityPanel items={(community.data || []).slice(0, 4)} /></div>
                  </div>
                  <aside className="space-y-4"><Watchlist title={t.watchlist} description={t.watchlistHint} items={watchItems} onOpen={openAsset} />{user ? <Allocation groups={portfolioGroups} totalValue={portfolioTotalValue} holdingCount={portfolioHoldings.length} loading={portfolio.isLoading} /> : <PortfolioLoginPrompt />}<Watchlist title={'암호화폐'} items={cryptoItems.slice(0, 5)} onOpen={openAsset} to="/crypto" /><AiPanel /></aside>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </section>
  );
}




