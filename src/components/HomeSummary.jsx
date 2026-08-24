import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAnnouncements, getCommunityPosts, getCryptoPrices, getKoreanStocks, getMarketIndices, getNews, getPortfolio, getUsStocks } from '../services/api';

const t = {
  greeting: '\uC548\uB155\uD558\uC138\uC694',
  dashboard: '\uC2DC\uC7A5 \uB300\uC2DC\uBCF4\uB4DC',
  subtitle: '\uC8FC\uC694 \uC9C0\uC218, \uBBF8\uAD6D \uC8FC\uC2DD, \uD55C\uAD6D \uC8FC\uC2DD, \uC554\uD638\uD654\uD3D0, \uC2DC\uC7A5 \uB274\uC2A4\uB97C \uD55C \uD654\uBA74\uC5D0\uC11C \uD655\uC778\uD558\uC138\uC694.',
  totalAssets: '\uD655\uC778 \uC790\uC0B0',
  breadth: '\uC2DC\uC7A5 \uB4F1\uB77D',
  performance: '\uC2DC\uC7A5\uBCC4 \uB4F1\uB77D \uBD84\uD3EC',
  allocation: '\uC790\uC0B0\uAD70 \uBE44\uC911',
  watchlist: '\uBCC0\uB3D9\uB960 \uB7AD\uD0B9',
  watchlistHint: '\uC624\uB298 \uB4F1\uB77D\uD3ED\uC774 \uD070 \uC790\uC0B0 \uC21C',
  heroHint: '\uC2DC\uC7A5\uBCC4 \uC8FC\uC694 \uC790\uC0B0',
  news: '\uC8FC\uC694 \uB274\uC2A4',
  ai: 'AI \uD22C\uC790 \uC778\uC0AC\uC774\uD2B8',
  aiText: '\uBCF4\uC720 \uC790\uC0B0\uACFC \uAD00\uB828 \uB274\uC2A4, \uC2DC\uC7A5 \uB370\uC774\uD130\uB97C \uC5F0\uACB0\uD574 \uD655\uC778\uD560 \uC810\uC744 \uC815\uB9AC\uD569\uB2C8\uB2E4.',
  portfolio: '\uD3EC\uD2B8\uD3F4\uB9AC\uC624\uC5D0\uC11C \uBCF4\uAE30',
  refresh: '\uC0C8\uB85C\uACE0\uCE68',
  refreshing: '\uC5C5\uB370\uC774\uD2B8 \uC911',
  updatedNow: '\uD604\uC7AC \uB370\uC774\uD130 \uAE30\uC900',
  empty: '\uD45C\uC2DC\uD560 \uC2DC\uC7A5 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.',
  error: '\uC2DC\uC7A5 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.',
  retry: '\uB2E4\uC2DC \uC2DC\uB3C4',
  noData: '\uB370\uC774\uD130 \uC5C6\uC74C',
  viewAll: '\uB354\uBCF4\uAE30',
  community: '\uCEE4\uBBA4\uB2C8\uD2F0',
  notices: '\uACF5\uC9C0',
  noticeHint: '\uC911\uC694\uD55C \uACF5\uC9C0\uB97C \uC81C\uBAA9\uC73C\uB85C \uBA3C\uC800 \uD655\uC778\uD558\uC138\uC694',
  noticeEmpty: '\uD604\uC7AC \uB4F1\uB85D\uB41C \uACF5\uC9C0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.',
  viewNotice: '\uB0B4\uC6A9 \uBCF4\uAE30',
  close: '\uB2EB\uAE30',
  loginPortfolioTitle: '\uB0B4 \uC790\uC0B0 \uBE44\uC911\uC740 \uB85C\uADF8\uC778 \uD6C4 \uD655\uC778\uD560 \uC218 \uC788\uC5B4\uC694',
  loginPortfolioText: '\uD3EC\uD2B8\uD3F4\uB9AC\uC624\uC5D0 \uBCF4\uC720 \uC790\uC0B0\uC744 \uCD94\uAC00\uD558\uBA74 \uC790\uC0B0\uAD70\uBCC4 \uBE44\uC911\uC744 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
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
  return `${new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(timestamp))} \uAE30\uC900`;
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
    { label: '\uB300\uC2DC\uBCF4\uB4DC', icon: 'D', to: '/' },
    { label: '\uC2DC\uC7A5', icon: 'M', to: '/market' },
    { label: '\uD3EC\uD2B8\uD3F4\uB9AC\uC624', icon: 'P', to: '/portfolio' },
    { label: '\uB274\uC2A4', icon: 'N', to: '/news' },
    { label: '\uCEE4\uBBA4\uB2C8\uD2F0', icon: 'C', to: '/community' },
  ];
  return (
    <aside className="hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-background-soft)] p-4 lg:block">
      <div className="flex items-center gap-3 px-2 py-2">
        <span className="grid size-10 place-items-center rounded-2xl bg-[var(--color-primary)] text-sm font-black text-white">MP</span>
        <div><p className="text-sm font-black text-[var(--color-text-primary)]">MoneyPlatform</p><p className="text-xs font-semibold text-[var(--color-text-secondary)]">{'\uD22C\uC790 \uB300\uC2DC\uBCF4\uB4DC'}</p></div>
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
        <p className="text-xs font-bold text-[var(--color-text-secondary)]">{'\uD655\uC778 \uC790\uC0B0'}</p>
        <p className="mt-2 text-3xl font-black tabular-nums text-[var(--color-text-primary)]">{counts.total}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold">
          <span className="rounded-xl bg-[var(--color-positive-soft)] px-2 py-2 text-[var(--color-positive)]">{'\uC0C1\uC2B9'} {counts.positive}</span>
          <span className="rounded-xl bg-[var(--color-negative-soft)] px-2 py-2 text-[var(--color-negative)]">{'\uD558\uB77D'} {counts.negative}</span>
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
              {notice.priority === 'important' ? '\uC911\uC694' : '\uACF5\uC9C0'}
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
                  {selected.priority === 'important' ? '\uC911\uC694' : '\uACF5\uC9C0'}
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
        <div><p className="text-xs font-bold text-[var(--color-text-secondary)]">{'\uD604\uC7AC\uAC00'}</p><p className="mt-1 text-2xl font-black tabular-nums text-[var(--color-text-primary)]">{item.price}</p></div>
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
        <div className="text-right"><p className="text-sm font-black text-[var(--color-positive)]">{'\uC0C1\uC2B9'} {positive}</p><p className="mt-1 text-sm font-black text-[var(--color-negative)]">{'\uD558\uB77D'} {negative}</p></div>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-[var(--color-negative-soft)]"><div className="h-full bg-[var(--color-positive)]" style={{ width: positiveWidth + '%' }} /></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <RankList title={'\uC0C1\uC2B9 TOP 5'} items={topGainers} positive />
        <RankList title={'\uD558\uB77D TOP 5'} items={topLosers} />
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
          <h2 className="mt-2 text-2xl font-black text-[var(--color-text-primary)]">{'\uC2DC\uC7A5\uAD70\uBCC4 \uC0C1\uC2B9/\uD558\uB77D \uBE44\uAD50'}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-text-secondary)]">{'\uC9C0\uC218\u00B7\uC8FC\uC2DD\uC740 \uC804\uC77C \uC885\uAC00 \uB300\uBE44, \uC554\uD638\uD654\uD3D0\uB294 24\uC2DC\uAC04 \uBCC0\uB3D9\uB960 \uAE30\uC900\uC785\uB2C8\uB2E4.'}</p>
        </div>
        <div className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-[var(--color-text-secondary)] sm:block">{'\uCD1D'} {total}{'\uAC1C'}</div>
      </div>
      <div className="mt-5 space-y-4">
        {rows.map((row) => (
          <div key={row.label} className="rounded-2xl bg-[var(--color-background-soft)] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-[var(--color-text-primary)]">{row.label}</p>
              <p className="text-xs font-black text-[var(--color-text-secondary)]">{'\uD558\uB77D'} {row.negative}{'\uAC1C'} / {'\uC0C1\uC2B9'} {row.positive}{'\uAC1C'}</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <div className="h-3 overflow-hidden rounded-full bg-white"><div className="ml-auto h-full rounded-full bg-[var(--color-negative)]" style={{ width: row.negativeWidth + '%' }} /></div>
                <div className="mt-1 flex justify-between text-[11px] font-bold text-[var(--color-negative)]"><span>{'\uD558\uB77D'}</span><span>{row.negativeWidth.toFixed(0)}%</span></div>
              </div>
              <div>
                <div className="h-3 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[var(--color-positive)]" style={{ width: row.positiveWidth + '%' }} /></div>
                <div className="mt-1 flex justify-between text-[11px] font-bold text-[var(--color-positive)]"><span>{'\uC0C1\uC2B9'}</span><span>{row.positiveWidth.toFixed(0)}%</span></div>
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
        <div><p className="text-xs font-black uppercase text-emerald-700">Portfolio</p><h2 className="mt-1 text-base font-black text-[var(--color-text-primary)]">{'\uB0B4 \uC790\uC0B0\uAD70 \uBE44\uC911'}</h2></div>
        <span className="rounded-full bg-[var(--color-background-soft)] px-2.5 py-1 text-xs font-black text-[var(--color-text-secondary)]">{holdingCount}{'\uAC1C'}</span>
      </div>
      {loading ? (
        <div className="mt-5 space-y-3"><div className="h-32 animate-pulse rounded-2xl bg-slate-100" /><div className="h-12 animate-pulse rounded-2xl bg-slate-100" /></div>
      ) : groups.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-background-soft)] p-4">
          <p className="text-sm font-black text-[var(--color-text-primary)]">{'\uB4F1\uB85D\uB41C \uBCF4\uC720 \uC790\uC0B0\uC774 \uC5C6\uC5B4\uC694'}</p>
          <p className="mt-2 text-xs font-semibold leading-5 text-[var(--color-text-secondary)]">{'\uD3EC\uD2B8\uD3F4\uB9AC\uC624\uC5D0 \uC790\uC0B0\uC744 \uCD94\uAC00\uD558\uBA74 \uD3C9\uAC00\uAE08\uC561 \uAE30\uC900 \uBE44\uC911\uC774 \uD45C\uC2DC\uB429\uB2C8\uB2E4.'}</p>
          <Link to="/portfolio" className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-full bg-emerald-700 px-4 text-sm font-black text-white hover:bg-emerald-800">{'\uC790\uC0B0 \uCD94\uAC00\uD558\uAE30'}</Link>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
            <div className="grid size-28 place-items-center rounded-full shadow-inner" style={{ background: 'conic-gradient(' + (gradient || '#e5e7eb 0% 100%') + ')' }}>
              <div className="grid size-20 place-items-center rounded-full bg-white text-center shadow-sm">
                <div><p className="text-[11px] font-bold text-[var(--color-text-secondary)]">{'\uD3C9\uAC00\uAE08\uC561'}</p><p className="text-lg font-black text-[var(--color-text-primary)]">100%</p></div>
              </div>
            </div>
            <div className="space-y-2">
              {groups.map((group) => {
                const percent = Math.round((group.value / safeTotal) * 100);
                return (
                  <div key={group.label}>
                    <div className="mb-1 flex items-center justify-between text-xs font-black"><span className="flex items-center gap-2 text-[var(--color-text-secondary)]"><span className="size-2.5 rounded-full" style={{ backgroundColor: group.hex }} />{group.label}</span><span className="text-[var(--color-text-primary)]">{percent}%</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--color-background-soft)]"><div className="h-full rounded-full" style={{ width: percent + '%', backgroundColor: group.hex }} /></div>
                    <p className="mt-1 text-[11px] font-bold text-[var(--color-text-tertiary)]">{group.count}{'\uAC1C'} / {group.formatted}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <Link to="/portfolio" className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-full bg-emerald-700 px-4 text-sm font-black text-white hover:bg-emerald-800">{'\uD3EC\uD2B8\uD3F4\uB9AC\uC624\uC5D0\uC11C \uC790\uC138\uD788 \uBCF4\uAE30'}</Link>
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
            <p className="text-xs font-black text-amber-700">{item.category || '\uB274\uC2A4'} {item.time ? `/ ${item.time}` : ''}</p>
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
      <h2 className="mt-2 text-lg font-black leading-7 text-[var(--color-text-primary)]">{'\uB0B4 \uC790\uC0B0 \uBE44\uC911\uC740 \uB85C\uADF8\uC778 \uD6C4 \uD655\uC778\uD560 \uC218 \uC788\uC5B4\uC694'}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{'\uBCF4\uC720 \uC790\uC0B0\uC744 \uB4F1\uB85D\uD558\uBA74 \uD3C9\uAC00\uAE08\uC561 \uAE30\uC900\uC73C\uB85C \uD55C\uAD6D \uC8FC\uC2DD, \uBBF8\uAD6D \uC8FC\uC2DD, \uC554\uD638\uD654\uD3D0 \uBE44\uC911\uC744 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4.'}</p>
      <div className="mt-5 space-y-2">
        {['\uD3C9\uAC00\uAE08\uC561 \uAE30\uC900 \uBE44\uC911', '\uC790\uC0B0\uAD70\uBCC4 \uBCF4\uC720 \uAC1C\uC218', '\uC218\uC775/\uC190\uC2E4 \uD655\uC778'].map((item) => <p key={item} className="rounded-2xl bg-[var(--color-background-soft)] px-3 py-2 text-xs font-black text-[var(--color-text-secondary)]">{item}</p>)}
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        <Link to="/portfolio" className="inline-flex h-10 items-center justify-center rounded-full bg-emerald-700 px-4 text-sm font-black text-white hover:bg-emerald-800">{'\uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uBCF4\uAE30'}</Link>
        <Link to="/favorites" className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--color-border)] px-4 text-sm font-black text-[var(--color-text-primary)] hover:bg-[var(--color-background-soft)]">{'\uAD00\uC2EC\uC790\uC0B0 \uBCF4\uAE30'}</Link>
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
            <p className="text-xs font-black text-emerald-700">{item.category || '\uC790\uC720'} / {item.authorName || item.author || '\uC775\uBA85'}</p>
            <p className="mt-1 line-clamp-2 text-sm font-black leading-6 text-[var(--color-text-primary)]">{item.title}</p>
            <p className="mt-1 text-xs font-bold text-[var(--color-text-secondary)]">{'\uC870\uD68C'} {item.views || 0} / {'\uB313\uAE00'} {item.comments || item.commentCount || 0}</p>
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
      <h2 className="mt-2 text-xl font-black">{'\uD22C\uC790 \uC810\uAC80'}</h2>
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

  const indices = (market.data || []).map((item) => compactAsset(item, '\uC9C0\uC218', 'market'));
  const cryptoItems = (crypto.data || []).map((item) => compactAsset(item, '\uC554\uD638\uD654\uD3D0', 'crypto'));
  const usItems = (stocks.data || []).map((item) => compactAsset(item, '\uBBF8\uAD6D \uC8FC\uC2DD', 'stock'));
  const krItems = (koreanStocks.data || []).map((item) => compactAsset(item, '\uD55C\uAD6D \uC8FC\uC2DD', 'korean-stock'));
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
    { label: '\uC9C0\uC218', items: indices },
    { label: '\uBBF8\uAD6D \uC8FC\uC2DD', items: usItems },
    { label: '\uD55C\uAD6D \uC8FC\uC2DD', items: krItems },
    { label: '\uC554\uD638\uD654\uD3D0', items: cryptoItems },
  ].filter((group) => group.items.length > 0);
  const assetByKey = new Map(quoteAssets.map((item) => [`${item.type}:${item.id}`, item]));
  const portfolioHoldings = portfolio.data?.holdings || [];
  const portfolioTotals = portfolioHoldings.reduce((acc, holding) => {
    const current = assetByKey.get(holding.itemKey);
    const type = holding.assetType || String(holding.itemKey || '').split(':')[0];
    const label = type === 'korean-stock' ? '\uD55C\uAD6D \uC8FC\uC2DD' : type === 'stock' ? '\uBBF8\uAD6D \uC8FC\uC2DD' : '\uC554\uD638\uD654\uD3D0';
    const currentPrice = parsePrice(current?.price);
    const fallbackPrice = Number(holding.averagePrice) || 0;
    const price = currentPrice || fallbackPrice;
    const value = Number(holding.quantity || 0) * price * (type === 'korean-stock' ? 1 : USD_TO_KRW_RATE);
    const previous = acc.get(label) || { label, value: 0, count: 0 };
    acc.set(label, { ...previous, value: previous.value + value, count: previous.count + 1 });
    return acc;
  }, new Map());
  const portfolioColors = { '\uD55C\uAD6D \uC8FC\uC2DD': '#10b981', '\uBBF8\uAD6D \uC8FC\uC2DD': '#8b5cf6', '\uC554\uD638\uD654\uD3D0': '#f59e0b' };
  const portfolioGroups = [...portfolioTotals.values()].filter((group) => group.value > 0).map((group) => ({ ...group, hex: portfolioColors[group.label] || '#64748b', formatted: `\u20A9${Math.round(group.value).toLocaleString('ko-KR')}` }));
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
                <h1 className="mt-1 text-2xl font-black tracking-tight text-[var(--color-text-primary)] sm:text-3xl">{t.greeting}, MoneyPlatform</h1>
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
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-soft)] p-3"><div className="mb-3 flex items-center justify-between gap-3 px-1"><p className="text-sm font-black text-[var(--color-text-primary)]">{'\uC2DC\uC7A5\uBCC4 \uC8FC\uC694 \uC790\uC0B0'}</p><span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[var(--color-text-secondary)] shadow-sm">{t.heroHint}</span></div><div className="flex gap-3 overflow-x-auto pb-1">{heroAssets.map((item) => <AssetHeroCard key={`${item.type}-${item.symbol}`} item={item} onOpen={openAsset} />)}</div></div>
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_340px]">
                  <div className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]"><SummaryCard total={assets.length} positive={positive} negative={negative} topGainers={topGainers} topLosers={topLosers} /><ChartPanel groups={breadthGroups} /></div>
                    <div className="grid gap-4 lg:grid-cols-2"><Watchlist title={'\uBBF8\uAD6D \uC8FC\uC2DD'} items={usItems.slice(0, 5)} onOpen={openAsset} to="/stocks/us" /><Watchlist title={'\uD55C\uAD6D \uC8FC\uC2DD'} items={krItems.slice(0, 5)} onOpen={openAsset} to="/stocks/kr" /></div>
                    <div className="grid gap-4 lg:grid-cols-2"><NewsPanel items={(news.data || []).slice(0, 4)} onOpen={openNews} /><CommunityPanel items={(community.data || []).slice(0, 4)} /></div>
                  </div>
                  <aside className="space-y-4"><Watchlist title={t.watchlist} description={t.watchlistHint} items={watchItems} onOpen={openAsset} />{user ? <Allocation groups={portfolioGroups} totalValue={portfolioTotalValue} holdingCount={portfolioHoldings.length} loading={portfolio.isLoading} /> : <PortfolioLoginPrompt />}<Watchlist title={'\uC554\uD638\uD654\uD3D0'} items={cryptoItems.slice(0, 5)} onOpen={openAsset} to="/crypto" /><AiPanel /></aside>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </section>
  );
}




