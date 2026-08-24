import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCommunityComment, createContentReport, deleteCommunityComment, deleteCommunityPost, getAssetNote, getCommunityComments, getSavedNews, postCommunityLike, postCommunityUnlike, postNewsAiSummary, saveAssetNote, toggleSavedNews } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useFavoritesStore } from '../store/favoritesStore';
import AssetIcon from './ui/AssetIcon';
import Card from './ui/Card';
import PriceChangeBadge from './ui/PriceChangeBadge';

const t = {
  market: '\uC2DC\uC7A5 \uC9C0\uC218',
  crypto: '\uC554\uD638\uD654\uD3D0',
  stock: '\uBBF8\uAD6D \uC8FC\uC2DD',
  'korean-stock': '\uD55C\uAD6D \uC8FC\uC2DD',
  news: '\uB274\uC2A4',
  community: '\uCEE4\uBBA4\uB2C8\uD2F0',
  detail: '\uC0C1\uC138 \uC815\uBCF4',
  favorite: '\uC990\uACA8\uCC3E\uAE30',
  remove: '\uC990\uACA8\uCC3E\uAE30 \uD574\uC81C',
  close: '\uB2EB\uAE30',
  back: '\uBAA9\uB85D\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30',
  comments: '\uB313\uAE00',
  comment: '\uB313\uAE00 \uC791\uC131',
  emptyComments: '\uC544\uC9C1 \uB313\uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.',
  login: '\uB85C\uADF8\uC778 \uD6C4 \uB313\uAE00\uC744 \uC791\uC131\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
  submit: '\uB4F1\uB85D',
  delete: '\uC0AD\uC81C',
  report: '\uC2E0\uACE0',
  postReport: '\uAC8C\uC2DC\uAE00 \uC2E0\uACE0',
  commentReport: '\uB313\uAE00 \uC2E0\uACE0',
  reportReason: '\uC2E0\uACE0 \uC0AC\uC720',
  postReportReason: '\uAC8C\uC2DC\uAE00 \uC2E0\uACE0 \uC0AC\uC720',
  commentReportReason: '\uB313\uAE00 \uC2E0\uACE0 \uC0AC\uC720',
  reportDone: '\uC2E0\uACE0\uAC00 \uC811\uC218\uB418\uC5C8\uC2B5\uB2C8\uB2E4.',
  confirmComment: '\uC774 \uB313\uAE00\uC744 \uC0AD\uC81C\uD560\uAE4C\uC694?',
  confirmPost: '\uC774 \uAE00\uC744 \uC0AD\uC81C\uD560\uAE4C\uC694?',
  source: '\uC6D0\uBB38 \uBCF4\uAE30',
  memo: '\uB0B4 \uBA54\uBAA8',
  memoPlaceholder: '\uC774 \uC885\uBAA9\uC744 \uBCF4\uBA70 \uAE30\uC5B5\uD560 \uD22C\uC790 \uC544\uC774\uB514\uC5B4\uB97C \uC801\uC5B4\uBCF4\uC138\uC694.',
  memoSaved: '\uBA54\uBAA8\uAC00 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4.',
  saveNews: '\uB274\uC2A4 \uC800\uC7A5',
  removeNews: '\uB274\uC2A4 \uC800\uC7A5 \uD574\uC81C',
  chart: '\uAC00\uACA9 \uCC28\uD2B8',
  metrics: '\uC8FC\uC694 \uC9C0\uD45C',
  info: '\uAE30\uBCF8 \uC815\uBCF4',
  aiSummary: 'AI \uC694\uC57D',
  aiSummaryTitle: 'AI \uD575\uC2EC \uC694\uC57D',
  aiLoading: 'AI \uBD84\uC11D \uC911...',
  aiFailed: 'AI \uC694\uC57D\uC744 \uC0DD\uC131\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.',
  aiDisabled: 'AI \uAE30\uB2A5\uC774 \uD604\uC7AC \uBE44\uD65C\uC131\uD654\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.',
  aiDailyLimit: '\uC624\uB298 \uC0AC\uC6A9\uD560 \uC218 \uC788\uB294 AI \uC0AC\uC6A9 \uD69F\uC218\uB97C \uBAA8\uB450 \uC0AC\uC6A9\uD588\uC2B5\uB2C8\uB2E4.',
  aiRetry: '\uB2E4\uC2DC \uC2DC\uB3C4',
  positives: '\uAE0D\uC815 \uC694\uC778',
  negatives: '\uBD80\uC815 \uC694\uC778',
  relatedAssets: '\uAD00\uB828 \uC790\uC0B0',
  caution: '\uCD94\uAC00 \uD655\uC778 \uC0AC\uD56D',
  noChart: '\uD45C\uC2DC\uD560 \uCC28\uD2B8 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.',
  like: '\uC88B\uC544\uC694',
  liked: '\uC88B\uC544\uC694 \uC644\uB8CC',
};

const quoteTypes = ['market', 'crypto', 'stock', 'korean-stock'];
const token = () => localStorage.getItem('mp_token') || '';
const isAsset = (type) => type === 'crypto' || type === 'stock' || type === 'korean-stock';
const isQuoteType = (type) => quoteTypes.includes(type);
const itemKey = (type, item) => `${type}:${item.id ?? item.symbol ?? item.title}`;

const numericValue = (value) => Number(String(value ?? '').replace(/[^0-9.-]/g, '')) || 0;
const parseCompactCount = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const text = String(value ?? '').trim().toUpperCase();
  if (!text) return 0;
  const number = Number.parseFloat(text.replace(/,/g, ''));
  if (!Number.isFinite(number)) return 0;
  if (text.endsWith('K')) return Math.round(number * 1000);
  if (text.endsWith('M')) return Math.round(number * 1000000);
  return Math.round(number);
};

const formatCompactCount = (value) => {
  const count = parseCompactCount(value);
  if (count >= 1000000) return String(Number((count / 1000000).toFixed(1))) + 'M';
  if (count >= 1000) return String(Number((count / 1000).toFixed(1))) + 'K';
  return String(count);
};

const fallbackPriceHistory = (item) => {
  const current = numericValue(item?.price ?? item?.value);
  const change = Number.parseFloat(String(item?.change ?? '').replace('%', '').replace('+', ''));
  if (!current || !Number.isFinite(change)) return [];
  const previous = change === -100 ? current : current / (1 + change / 100);
  return [previous, current];
};
const safeValue = (value) => {
  if (value === 0) return '0';
  if (value == null || value === '') return '-';
  return String(value);
};

const ChangeText = ({ change, isPositive }) => {
  const value = Number.parseFloat(String(change ?? '').replace('%', '').replace('+', ''));
  const neutral = !Number.isFinite(value) || value === 0;
  const positive = !neutral && (typeof isPositive === 'boolean' ? isPositive : value > 0);
  const color = neutral ? 'text-slate-500' : positive ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]';

  return <span className={`font-bold ${color}`}>{safeValue(change)}</span>;
};

const BackIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4">
    <path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
  </svg>
);

const ExternalIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4">
    <path d="M8 5H5.8A1.8 1.8 0 0 0 4 6.8v7.4A1.8 1.8 0 0 0 5.8 16h7.4a1.8 1.8 0 0 0 1.8-1.8V12M11 4h5v5M9.5 10.5 16 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
  </svg>
);

const StarIcon = ({ filled = false }) => (
  <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4">
    <path
      d="m10 2.8 2.2 4.46 4.92.72-3.56 3.47.84 4.9L10 14.03 5.6 16.35l.84-4.9L2.88 7.98l4.92-.72L10 2.8Z"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.6"
    />
  </svg>
);

function UserAvatar({ name, className = '' }) {
  const initial = String(name || '?').trim().charAt(0).toUpperCase() || '?';

  return (
    <span className={`grid size-10 shrink-0 place-items-center rounded-full bg-[var(--color-primary-soft)] text-xs font-black text-[var(--color-primary)] ${className}`}>
      {initial}
    </span>
  );
}

function StatIcon({ type }) {
  const paths = {
    views: 'M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    comments: 'M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7A2.5 2.5 0 0 1 17.5 15H9l-5 4v-4.5A2.5 2.5 0 0 1 4 12.5v-7Z',
    likes: 'm12 20.2-.9-.82C5.2 14 2 11.1 2 7.54A4.55 4.55 0 0 1 6.6 3c2 0 3.32 1.12 4.1 2.07A5.12 5.12 0 0 1 14.8 3 4.55 4.55 0 0 1 19.4 7.54c0 3.56-3.2 6.46-9.1 11.84l-.3.27Z',
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5">
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function MetaChip({ type, label, value }) {
  if (value == null || value === '') return null;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-[var(--color-text-secondary)]">
      {type && <StatIcon type={type} />}
      {label} {value}
    </span>
  );
}

function AiSummarySkeleton() {
  return (
    <Card hover={false} className="p-5 sm:p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-32 rounded bg-slate-100" />
        <div className="h-4 w-full rounded bg-slate-100" />
        <div className="h-4 w-5/6 rounded bg-slate-100" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-24 rounded-2xl bg-slate-100" />
          <div className="h-24 rounded-2xl bg-slate-100" />
        </div>
      </div>
    </Card>
  );
}

function AiList({ title, items }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-slate-50 p-4">
      <h4 className="text-sm font-extrabold text-[var(--color-text-primary)]">{title}</h4>
      {items?.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-text-secondary)]">
          {items.map((item) => <li key={item}>- {item}</li>)}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-[var(--color-text-tertiary)]">-</p>
      )}
    </div>
  );
}

function AiSummaryResult({ result }) {
  if (!result) return null;

  return (
    <Card hover={false} className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">AI Insight</p>
          <h3 className="mt-1 text-lg font-extrabold text-[var(--color-text-primary)]">{t.aiSummaryTitle}</h3>
        </div>
        <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-extrabold text-[var(--color-primary)]">{t.aiSummary}</span>
      </div>
      <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <h4 className="text-sm font-extrabold text-[var(--color-text-primary)]">핵심 요약</h4>
        <p className="mt-2 whitespace-pre-line break-words text-sm leading-7 text-[var(--color-text-secondary)]">{result.summary || '-'}</p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <AiList title={t.positives} items={result.positives} />
        <AiList title={t.negatives} items={result.negatives} />
      </div>
      {result.relatedAssets?.length > 0 && (
        <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <h4 className="text-sm font-extrabold text-[var(--color-text-primary)]">{t.relatedAssets}</h4>
          <div className="mt-3 flex flex-wrap gap-2">
            {result.relatedAssets.map((asset) => (
              <span key={asset} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-[var(--color-text-secondary)]">
                {asset}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <h4 className="text-sm font-extrabold text-amber-700">{t.caution}</h4>
        <p className="mt-2 whitespace-pre-line break-words text-sm leading-7 text-amber-800">{result.caution || '-'}</p>
      </div>
    </Card>
  );
}

function AiSummaryError({ error, onRetry }) {
  const message = error?.code === 'AI_DISABLED' || error?.code === 'MISSING_API_KEY'
    ? t.aiDisabled
    : error?.code === 'AI_DAILY_LIMIT_REACHED' || error?.code === 'RATE_LIMIT'
      ? t.aiDailyLimit
      : error?.message || t.aiFailed;
  return (
    <Card hover={false} className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-[var(--color-text-secondary)]">{message}</p>
        <button type="button" onClick={onRetry} className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] px-4 text-sm font-bold text-[var(--color-primary)] hover:bg-blue-100">
          {t.aiRetry}
        </button>
      </div>
    </Card>
  );
}

function MetricCard({ label, value, change, isPositive }) {
  return (
    <Card hover={false} className="min-h-24 p-4">
      <p className="text-xs font-semibold text-[var(--color-text-secondary)]">{label}</p>
      <div className="mt-3 break-words text-lg font-extrabold text-[var(--color-text-primary)]">
        {change ? <ChangeText change={value} isPositive={isPositive} /> : safeValue(value)}
      </div>
    </Card>
  );
}

function Sparkline({ values = [], positive = true, type = 'stock' }) {
  const points = values.map(Number).filter(Number.isFinite);
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const path = points.map((value, index) => {
    const x = (index / (points.length - 1)) * 100;
    const y = 48 - ((value - min) / range) * 38;
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
  const fillPath = `${path} L 100 54 L 0 54 Z`;
  const stroke = positive ? 'var(--color-positive)' : 'var(--color-negative)';
  const fill = positive ? 'rgba(239, 68, 68, 0.08)' : 'rgba(37, 99, 235, 0.08)';
  const basis = type === 'crypto' ? '\uCD5C\uADFC \uAC00\uACA9 \uC774\uB825\uACFC 24\uC2DC\uAC04 \uBCC0\uB3D9\uB960 \uAE30\uC900\uC785\uB2C8\uB2E4.' : '\uCD5C\uADFC \uAC00\uACA9 \uC774\uB825\uACFC \uC804\uC77C \uC885\uAC00 \uB300\uBE44 \uB4F1\uB77D\uB960 \uAE30\uC900\uC785\uB2C8\uB2E4.';

  return (
    <Card hover={false} className="p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-[var(--color-text-primary)]">{t.chart}</h3>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{basis}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${positive ? 'bg-[var(--color-positive-soft)] text-[var(--color-positive)]' : 'bg-[var(--color-negative-soft)] text-[var(--color-negative)]'}`}>
          {positive ? '상승 흐름' : '하락 흐름'}
        </span>
      </div>
      <div className="min-h-72 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-slate-50/70 p-4 sm:min-h-80 lg:min-h-[360px]">
        <svg viewBox="0 0 100 56" className="h-64 w-full overflow-visible sm:h-72 lg:h-[320px]" role="img" aria-label="가격 흐름 차트">
          <path d={fillPath} fill={fill} />
          <path d={path} fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.6" />
        </svg>
      </div>
    </Card>
  );
}

function DetailHero({ type, item, selected, onToggleFavorite }) {
  const title = item.title || item.name || item.symbol || t.detail;
  const subtitle = type === 'market' ? '' : item.symbol || item.code || item.category || t[type] || t.detail;
  const price = type === 'market' ? item.value : item.price;
  const change = item.change;

  return (
    <Card hover={false} className="p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <AssetIcon label={title} symbol={item.symbol || item.code || title} image={item.image || item.icon} className="size-12 rounded-3xl text-sm sm:size-14" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-extrabold text-[var(--color-primary)]">{t[type] || t.detail}</span>
              {subtitle && subtitle !== (t[type] || t.detail) && <span className="truncate rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{subtitle}</span>}
            </div>
            <h1 className="mt-3 break-words text-2xl font-black tracking-tight text-[var(--color-text-primary)] sm:text-3xl lg:text-4xl">{title}</h1>
          </div>
        </div>
        {isAsset(type) && (
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label={selected ? t.remove : t.favorite}
            className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-extrabold transition ${selected ? 'border-amber-300 bg-amber-50 text-amber-600' : 'border-[var(--color-border)] bg-white text-slate-600 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600'}`}
          >
            <StarIcon filled={selected} />
            {selected ? t.remove : t.favorite}
          </button>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-text-secondary)]">{type === 'market' ? '현재 지수' : '현재가'}</p>
          <p className="mt-2 break-words text-4xl font-black tracking-tight text-[var(--color-text-primary)] sm:text-5xl">{safeValue(price)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {change != null && <PriceChangeBadge change={change} isPositive={item.isPositive} className="px-3 py-1.5 text-sm" />}
          {item.time && <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">{item.time}</span>}
        </div>
      </div>
    </Card>
  );
}

function TextCard({ title, children }) {
  if (!children) return null;

  return (
    <Card hover={false} className="p-5 sm:p-6">
      <h3 className="text-lg font-extrabold text-[var(--color-text-primary)]">{title}</h3>
      <div className="mt-4 whitespace-pre-line break-words text-base leading-7 text-[var(--color-text-secondary)]">{children}</div>
    </Card>
  );
}

function SimpleDetailHeader({ type, item }) {
  const title = item.title || item.name || item.symbol || t.detail;

  return (
    <Card hover={false} className="p-5 sm:p-6">
      <p className="text-sm font-bold text-[var(--color-primary)]">{t[type] || t.detail}</p>
      <h1 className="mt-3 break-words text-2xl font-black tracking-tight text-[var(--color-text-primary)] sm:text-3xl">{title}</h1>
      {item.category && <span className="mt-4 inline-flex rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-extrabold text-[var(--color-primary)]">{item.category}</span>}
    </Card>
  );
}

function CommunityDetailHeader({ item, user, onDelete, deleting, liked, likeCount, onLike, liking, onToggleReport, reportOpen }) {
  const isOwner = user?.username === item.author;
  const displayName = item.authorName || item.author;
  const likeClass = liked
    ? 'border-rose-500 bg-rose-500 text-white'
    : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100';
  const reportClass = reportOpen
    ? 'border-amber-300 bg-amber-50 text-amber-700'
    : 'border-amber-200 bg-white text-amber-600 hover:bg-amber-50';

  return (
    <Card hover={false} className="overflow-hidden border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/70 p-0">
      <div className="border-b border-emerald-100/80 bg-emerald-50/70 px-5 py-4 sm:px-7">
        <div className="flex flex-wrap items-center gap-2">
          {item.category && <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-extrabold text-white">{item.category}</span>}
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">{t.community}</span>
        </div>
        <h1 className="mt-4 break-words text-2xl font-black tracking-tight text-[var(--color-text-primary)] sm:text-3xl lg:text-4xl">{item.title || t.detail}</h1>
      </div>
      <div className="p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar name={displayName} />
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-[var(--color-text-primary)]">{displayName || '-'}</p>
              <p className="mt-1 text-xs font-medium text-[var(--color-text-tertiary)]">{item.createdAt || item.time || '\uD604\uC7AC \uB370\uC774\uD130 \uAE30\uC900'}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <MetaChip type="views" label={'\uC870\uD68C'} value={item.views} />
            <MetaChip type="comments" label={'\uB313\uAE00'} value={item.comments} />
            <button type="button" onClick={onLike} disabled={liking} aria-pressed={liked} className={'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-black transition disabled:opacity-60 ' + likeClass}>
              <StatIcon type="likes" />
              {liked ? '\uC88B\uC544\uC694 \uC644\uB8CC' : '\uC88B\uC544\uC694'} {likeCount}
            </button>
            {user && !isOwner && (
              <button type="button" onClick={onToggleReport} className={'inline-flex min-h-9 items-center justify-center rounded-full border px-3 text-xs font-black transition ' + reportClass}>
                {reportOpen ? '\uB2EB\uAE30' : '\uAC8C\uC2DC\uAE00 \uC2E0\uACE0'}
              </button>
            )}
            {isOwner && (
              <button type="button" onClick={onDelete} disabled={deleting} className="inline-flex min-h-9 items-center justify-center rounded-full border border-red-200 px-3 text-xs font-bold text-red-500 transition hover:bg-red-50 disabled:opacity-60">
                {t.delete}
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function DetailModal({ open, type, item, onClose, standalone = false }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const [comment, setComment] = useState('');
  const [postReportReason, setPostReportReason] = useState('');
  const [openPostReport, setOpenPostReport] = useState(false);
  const [likedPosts, setLikedPosts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mp_liked_detail_posts') || '[]');
    } catch {
      return [];
    }
  });
  const [commentReportReasons, setCommentReportReasons] = useState({});
  const [openCommentReportId, setOpenCommentReportId] = useState(null);
  const favorites = useFavoritesStore((state) => state.favorites);
  const toggle = useFavoritesStore((state) => state.toggle);
  const tokenValue = token();
  const assetKey = item ? itemKey(type, item) : '';
  const note = useQuery({
    queryKey: ['asset-note', assetKey],
    queryFn: () => getAssetNote(tokenValue, assetKey),
    enabled: open && Boolean(user) && isAsset(type) && Boolean(assetKey),
  });
  const savedNews = useQuery({
    queryKey: ['saved-news'],
    queryFn: () => getSavedNews(tokenValue),
    enabled: open && Boolean(user) && type === 'news',
  });
  const newsAiKey = String(item?.url || item?.id || item?.title || '');
  const newsAiSummary = useQuery({
    queryKey: ['ai', 'news-summary', newsAiKey],
    queryFn: () => postNewsAiSummary({
      title: item.title,
      summary: item.summary,
      content: item.content,
      description: item.description,
      category: item.category,
      source: item.source || item.provider,
      url: item.url,
      relatedAssets: [item.symbol, item.code].filter(Boolean),
    }),
    enabled: false,
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const [memo, setMemo] = useState(null);
  const comments = useQuery({
    queryKey: ['community', item?.id, 'comments'],
    queryFn: () => getCommunityComments(item.id),
    enabled: open && type === 'community' && Boolean(item?.id),
  });
  const createComment = useMutation({
    mutationFn: () => createCommunityComment(token(), item.id, comment),
    onSuccess: () => {
      setComment('');
      client.invalidateQueries({ queryKey: ['community', item?.id, 'comments'] });
      client.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
  const removeComment = useMutation({
    mutationFn: (id) => deleteCommunityComment(tokenValue, id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['community', item?.id, 'comments'] });
      client.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
  const removePost = useMutation({
    mutationFn: () => deleteCommunityPost(tokenValue, item.id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['community', 'posts'] });
      onClose?.();
    },
  });
  const reportContent = useMutation({
    mutationFn: ({ targetType, targetId, reason }) => createContentReport(tokenValue, { targetType, targetId, reason }),
    onSuccess: (_data, variables) => {
      if (variables?.targetType === 'comment') {
        setCommentReportReasons((values) => ({ ...values, [variables.targetId]: '' }));
        setOpenCommentReportId(null);
      }
    },
  });
  const likePost = useMutation({
    mutationFn: ({ id, liked: wasLiked }) => (wasLiked ? postCommunityUnlike(id) : postCommunityLike(id)),
    onSettled: () => client.invalidateQueries({ queryKey: ['community', 'posts'] }),
  });
  const saveMemo = useMutation({
    mutationFn: () => saveAssetNote(tokenValue, assetKey, memo ?? note.data?.note?.note ?? ''),
    onSuccess: (result) => {
      setMemo(result.note.note || '');
      client.invalidateQueries({ queryKey: ['asset-note', assetKey] });
    },
  });
  const toggleNews = useMutation({
    mutationFn: () => toggleSavedNews(tokenValue, {
      newsKey: item.url || String(item.id),
      title: item.title,
      summary: item.summary,
      category: item.category,
      url: item.url,
    }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['saved-news'] }),
  });

  if (!open || !item) return null;

  const key = assetKey;
  const selected = favorites.includes(key);
  const saved = (savedNews.data?.news || []).some((entry) => entry.newsKey === (item.url || String(item.id)));
  const detailLiked = type === 'community' && likedPosts.includes(item.id);
  const detailLikeCount = formatCompactCount(parseCompactCount(item.likes) + (detailLiked ? 1 : 0));
  const toggleCommunityLike = () => {
    if (type !== 'community' || likePost.isPending) return;
    const wasLiked = likedPosts.includes(item.id);
    const next = wasLiked ? likedPosts.filter((id) => id !== item.id) : [...likedPosts, item.id];
    setLikedPosts(next);
    localStorage.setItem('mp_liked_detail_posts', JSON.stringify(next));
    likePost.mutate({ id: item.id, liked: wasLiked }, {
      onError: () => {
        setLikedPosts(likedPosts);
        localStorage.setItem('mp_liked_detail_posts', JSON.stringify(likedPosts));
      },
    });
  };
  const requestNewsAiSummary = () => {
    if (newsAiSummary.data || newsAiSummary.isFetching) return;
    newsAiSummary.refetch();
  };
  const isQuote = isQuoteType(type);
  const chartValues = Array.isArray(item.priceHistory) && item.priceHistory.map(Number).filter(Number.isFinite).length > 1 ? item.priceHistory : fallbackPriceHistory(item);
  const hasChart = isQuote && chartValues.length > 1;
  const rows = type === 'market'
    ? [['\uD604\uC7AC \uC9C0\uC218', item.value], ['\uC804\uC77C \uB300\uBE44 \uB4F1\uB77D\uB960', item.change, true]]
    : type === 'crypto' || type === 'stock' || type === 'korean-stock'
      ? [['\uD604\uC7AC\uAC00', item.price], [type === 'crypto' ? '24\uC2DC\uAC04 \uBCC0\uB3D9\uB960' : '\uC804\uC77C \uB300\uBE44 \uB4F1\uB77D\uB960', item.change, true]]
      : type === 'news'
        ? [['\uCE74\uD14C\uACE0\uB9AC', item.category], ['\uC2DC\uAC04', item.time]]
        : [['\uC870\uD68C', item.views], ['\uC88B\uC544\uC694', item.likes], ['\uB313\uAE00', item.comments]];
  const infoRows = [
    type !== 'market' ? ['\uAD6C\uBD84', t[type] || t.detail] : null,
    ['\uC2EC\uBCFC', item.symbol],
    ['\uCF54\uB4DC', item.code],
    type !== 'market' ? ['\uCE74\uD14C\uACE0\uB9AC', item.category] : null,
    ['\uC2DC\uAC04', item.time],
  ].filter((row) => row && row[1] != null && row[1] !== '');

  const panel = (
    <article className={`w-full overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-background)] shadow-[var(--shadow-card)] ${standalone ? '' : 'max-h-[88vh] overflow-y-auto shadow-xl'}`}>
      <div className="border-b border-[var(--color-border)] bg-white/90 px-4 py-4 backdrop-blur sm:px-6">
        <button type="button" onClick={onClose} className="inline-flex min-h-10 items-center gap-2 rounded-2xl px-3 text-sm font-bold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]">
          <BackIcon />
          {standalone ? t.back : t.close}
        </button>
      </div>

      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {type === 'community'
          ? <CommunityDetailHeader item={item} user={user} deleting={removePost.isPending} liked={detailLiked} likeCount={detailLikeCount} liking={likePost.isPending} onLike={toggleCommunityLike} reportOpen={openPostReport} onToggleReport={() => setOpenPostReport((value) => !value)} onDelete={() => { if (window.confirm(t.confirmPost)) removePost.mutate(); }} />
          : isQuote
            ? <DetailHero type={type} item={item} selected={selected} onToggleFavorite={() => toggle(key)} />
            : <SimpleDetailHeader type={type} item={item} />}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <div className="min-w-0 space-y-6">
            {hasChart && <Sparkline values={chartValues} positive={item.isPositive} type={type} />}
            {isQuote && !hasChart && (
              <Card hover={false} className="p-5 sm:p-6">
                <h3 className="text-lg font-extrabold text-[var(--color-text-primary)]">{t.chart}</h3>
                <div className="mt-4 grid min-h-60 place-items-center rounded-2xl border border-dashed border-[var(--color-border)] bg-slate-50 text-sm font-semibold text-[var(--color-text-secondary)]">
                  {t.noChart}
                </div>
              </Card>
            )}

            <TextCard title={type === 'community' ? '\uAC8C\uC2DC\uAE00 \uBCF8\uBB38' : isQuote ? '\uC790\uC0B0 \uC815\uBCF4' : t.detail}>{item.summary || item.content || item.description}</TextCard>

            {type === 'news' && item.url && (
              <Card hover={false} className="p-5 sm:p-6">
                <h3 className="text-lg font-extrabold text-[var(--color-text-primary)]">{'\uB274\uC2A4 \uB9C1\uD06C'}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white transition hover:bg-blue-700">
                    {t.source}
                    <ExternalIcon />
                  </a>
                  {user && (
                    <button type="button" onClick={() => toggleNews.mutate()} className={`inline-flex min-h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-bold transition ${saved ? 'border-amber-300 bg-amber-50 text-amber-600' : 'border-[var(--color-border)] bg-white text-slate-600 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600'}`}>
                      <StarIcon filled={saved} />
                      {saved ? t.removeNews : t.saveNews}
                    </button>
                  )}
                  <button type="button" onClick={requestNewsAiSummary} disabled={newsAiSummary.isFetching || Boolean(newsAiSummary.data)} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-white px-4 text-sm font-bold text-[var(--color-primary)] transition hover:border-blue-200 hover:bg-[var(--color-primary-soft)] disabled:cursor-not-allowed disabled:opacity-60">
                    {newsAiSummary.isFetching ? t.aiLoading : t.aiSummary}
                  </button>
                </div>
              </Card>
            )}

            {type === 'news' && newsAiSummary.isFetching && <AiSummarySkeleton />}
            {type === 'news' && newsAiSummary.data?.result && <AiSummaryResult result={newsAiSummary.data.result} />}
            {type === 'news' && newsAiSummary.isError && <AiSummaryError error={newsAiSummary.error} onRetry={() => newsAiSummary.refetch()} />}

            {user && isAsset(type) && (
              <Card hover={false} className="p-5 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-extrabold text-[var(--color-text-primary)]">{t.memo}</h3>
                  {saveMemo.isSuccess && <span className="text-xs font-semibold text-emerald-600">{t.memoSaved}</span>}
                </div>
                <textarea value={memo ?? note.data?.note?.note ?? ''} onChange={(event) => setMemo(event.target.value)} placeholder={t.memoPlaceholder} rows={4} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-blue-100" />
                <div className="mt-3 flex justify-end">
                  <button type="button" onClick={() => saveMemo.mutate()} disabled={saveMemo.isPending} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:bg-slate-300">{saveMemo.isPending ? '\uC800\uC7A5 \uC911...' : '\uC800\uC7A5'}</button>
                </div>
              </Card>
            )}

            {type === 'community' && (
              <Card hover={false} className="overflow-hidden border-emerald-100 bg-white p-0">
                {user && user.username !== item.author && openPostReport && (
                  <div className="border-b border-amber-100 bg-amber-50/70 p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-black text-amber-800">{'\uAC8C\uC2DC\uAE00 \uC2E0\uACE0'}</h3>
                        <p className="mt-1 text-sm text-amber-700">{'\uAC8C\uC2DC\uAE00 \uC804\uCCB4\uC5D0 \uB300\uD55C \uC2E0\uACE0\uC785\uB2C8\uB2E4. \uD2B9\uC815 \uB313\uAE00\uC740 \uB313\uAE00 \uC606\uC758 \uB313\uAE00 \uC2E0\uACE0\uB97C \uC774\uC6A9\uD574\uC8FC\uC138\uC694.'}</p>
                      </div>
                      <button type="button" onClick={() => setOpenPostReport(false)} className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-black text-amber-700">{t.close}</button>
                    </div>
                    <label className="mt-4 block text-xs font-bold text-amber-800" htmlFor="post-report-reason">{'\uAC8C\uC2DC\uAE00 \uC2E0\uACE0 \uC0AC\uC720'}</label>
                    <input id="post-report-reason" value={postReportReason} onChange={(event) => setPostReportReason(event.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-amber-200 bg-white px-4 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100" placeholder={'\uC2A4\uD338, \uC695\uC124, \uD5C8\uC704 \uC815\uBCF4 \uB4F1'} />
                    <div className="mt-3 flex justify-end">
                      <button type="button" onClick={() => reportContent.mutate({ targetType: 'post', targetId: item.id, reason: postReportReason })} disabled={reportContent.isPending || postReportReason.trim().length < 2} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-amber-500 px-4 text-sm font-bold text-white transition hover:bg-amber-600 disabled:bg-slate-300">{reportContent.isPending ? '\uC2E0\uACE0 \uC911...' : '\uAC8C\uC2DC\uAE00 \uC2E0\uACE0 \uC811\uC218'}</button>
                    </div>
                    {reportContent.isSuccess && <p className="mt-2 text-xs font-semibold text-emerald-600">{'\uC2E0\uACE0\uAC00 \uC811\uC218\uB418\uC5C8\uC2B5\uB2C8\uB2E4.'}</p>}
                  </div>
                )}

                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-extrabold text-[var(--color-text-primary)]">{t.comments}</h3>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{comments.data?.comments?.length ?? item.comments ?? 0}{'\uAC1C\uC758 \uB313\uAE00\uC774 \uC788\uC2B5\uB2C8\uB2E4.'}</p>
                    </div>
                  </div>
                  {user ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (comment.trim().length >= 2) createComment.mutate(); }} className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50/50 p-4">
                      <div className="mb-3 flex items-center gap-3">
                        <UserAvatar name={user.name || user.username} className="size-8" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-[var(--color-text-primary)]">{user.name || user.username}</p>
                          <p className="text-xs text-[var(--color-text-tertiary)]">{'2\uC790 \uC774\uC0C1 \uC785\uB825\uD558\uBA74 \uB4F1\uB85D\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.'}</p>
                        </div>
                      </div>
                      <label htmlFor="community-comment" className="sr-only">{t.comment}</label>
                      <textarea id="community-comment" value={comment} onChange={(event) => setComment(event.target.value)} placeholder={t.comment} rows={4} className="min-h-28 w-full resize-y rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-[var(--color-text-tertiary)]">{'\uC11C\uB85C\uC5D0\uAC8C \uB3C4\uC6C0\uB418\uB294 \uD22C\uC790 \uC758\uACAC\uC744 \uB098\uB220\uBCF4\uC138\uC694.'}</p>
                        <button type="submit" disabled={comment.trim().length < 2 || createComment.isPending} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-700 px-5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:bg-slate-300">{createComment.isPending ? '\uB4F1\uB85D \uC911...' : t.submit}</button>
                      </div>
                    </form>
                  ) : (
                    <p className="mt-5 rounded-2xl border border-[var(--color-border)] bg-slate-50 p-4 text-sm font-semibold text-[var(--color-text-secondary)]">{t.login}</p>
                  )}

                  {comments.isLoading && (
                    <div className="mt-5 space-y-3">
                      {[1, 2].map((entry) => (
                        <div key={entry} className="animate-pulse rounded-2xl border border-[var(--color-border)] bg-white p-4">
                          <div className="h-4 w-28 rounded bg-slate-100" />
                          <div className="mt-3 h-4 w-full rounded bg-slate-100" />
                          <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
                        </div>
                      ))}
                    </div>
                  )}
                  {comments.error && <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{'\uB313\uAE00\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.'}</p>}
                  {!comments.isLoading && !comments.error && comments.data?.comments?.length > 0 ? (
                    <div className="mt-5 overflow-hidden rounded-3xl border border-emerald-100 bg-white">
                      {comments.data.comments.map((entry) => (
                        <div key={entry.id} className="border-b border-[var(--color-border)] p-4 text-sm last:border-b-0">
                          <div className="flex gap-3">
                            <UserAvatar name={entry.authorName || entry.author} className="size-9" />
                            <div className="min-w-0 flex-1">
                              <div className="mb-2 flex flex-wrap justify-between gap-3 text-xs text-slate-400">
                                <div className="min-w-0">
                                  <b className="block truncate text-sm text-slate-800">{entry.authorName || entry.author}</b>
                                  <span>{entry.createdAt}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  {user && user.username !== entry.author && <button type="button" onClick={() => setOpenCommentReportId((current) => (current === entry.id ? null : entry.id))} className="rounded-full border border-amber-200 px-3 py-1 font-bold text-amber-600 hover:bg-amber-50 hover:text-amber-700">{openCommentReportId === entry.id ? '\uB2EB\uAE30' : '\uC2E0\uACE0'}</button>}
                                  {user?.username === entry.author && <button type="button" onClick={() => { if (window.confirm(t.confirmComment)) removeComment.mutate(entry.id); }} className="rounded-full border border-red-100 px-3 py-1 font-bold text-red-500 hover:bg-red-50 hover:text-red-600">{t.delete}</button>}
                                </div>
                              </div>
                              <p className="whitespace-pre-line break-words text-sm leading-6 text-slate-700">{entry.content}</p>
                              {user && user.username !== entry.author && openCommentReportId === entry.id && (
                                <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-3">
                                  <label className="text-xs font-bold text-amber-700" htmlFor={'comment-report-' + entry.id}>{'\uB313\uAE00 \uC2E0\uACE0 \uC0AC\uC720'}</label>
                                  <input id={'comment-report-' + entry.id} value={commentReportReasons[entry.id] || ''} onChange={(event) => setCommentReportReasons((values) => ({ ...values, [entry.id]: event.target.value }))} className="mt-2 h-10 w-full rounded-xl border border-amber-100 bg-white px-3 text-sm outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100" placeholder={'\uC2A4\uD338, \uC695\uC124, \uD5C8\uC704 \uC815\uBCF4 \uB4F1'} />
                                  <div className="mt-2 flex justify-end">
                                    <button type="button" onClick={() => reportContent.mutate({ targetType: 'comment', targetId: entry.id, reason: commentReportReasons[entry.id] })} disabled={reportContent.isPending || String(commentReportReasons[entry.id] || '').trim().length < 2} className="inline-flex min-h-9 items-center justify-center rounded-xl bg-amber-500 px-3 text-xs font-bold text-white transition hover:bg-amber-600 disabled:bg-slate-300">
                                      {reportContent.isPending ? '\uC2E0\uACE0 \uC911...' : '\uC2E0\uACE0 \uC811\uC218'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !comments.isLoading && !comments.error && (
                    <p className="mt-4 rounded-2xl border border-[var(--color-border)] bg-slate-50 p-4 text-sm text-[var(--color-text-secondary)]">{t.emptyComments}</p>
                  )}
                </div>
              </Card>
            )}
          </div>

          <aside className="min-w-0 space-y-6">
            <Card hover={false} className="p-5 sm:p-6">
              <h3 className="text-lg font-extrabold text-[var(--color-text-primary)]">{t.metrics}</h3>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {rows.map(([label, value, change]) => <MetricCard key={label} label={label} value={value} change={change} isPositive={item.isPositive} />)}
              </div>
            </Card>

            {infoRows.length > 0 && (
              <Card hover={false} className="p-5 sm:p-6">
                <h3 className="text-lg font-extrabold text-[var(--color-text-primary)]">{t.info}</h3>
                <dl className="mt-4 divide-y divide-[var(--color-border)]">
                  {infoRows.map(([label, value]) => (
                    <div key={label} className="flex gap-4 py-3 text-sm">
                      <dt className="w-20 shrink-0 font-semibold text-[var(--color-text-secondary)]">{label}</dt>
                      <dd className="min-w-0 flex-1 break-words text-right font-bold text-[var(--color-text-primary)]">{safeValue(value)}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            )}
          </aside>
        </div>
      </div>
    </article>
  );

  if (standalone) {
    return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{panel}</main>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-6xl">{panel}</div>
    </div>
  );
}
















