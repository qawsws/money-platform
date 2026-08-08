import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useSearch } from '../context/SearchContext';
import { getNews } from '../services/api';
import Card from './ui/Card';
import PageHeader from './ui/PageHeader';
import QuoteSectionHeader from './ui/QuoteSectionHeader';
import ResultToolbar from './ui/ResultToolbar';

const t = {
  title: '\uC8FC\uC694 \uB274\uC2A4',
  description: '\uC2DC\uC7A5\uC5D0 \uC601\uD5A5\uC744 \uC904 \uC218 \uC788\uB294 \uCD5C\uC2E0 \uC18C\uC2DD\uC744 \uD655\uC778\uD558\uC138\uC694.',
  pageTitle: '\uB274\uC2A4',
  pageDescription: '\uAE08\uC735\uC2DC\uC7A5\uACFC \uC8FC\uC694 \uC790\uC0B0\uC5D0 \uC601\uD5A5\uC744 \uC904 \uC218 \uC788\uB294 \uCD5C\uC2E0 \uC18C\uC2DD\uC744 \uD655\uC778\uD558\uC138\uC694.',
  empty: '\uD45C\uC2DC\uD560 \uB274\uC2A4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.',
  searchEmpty: '\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.',
  more: '\uB354\uBCF4\uAE30',
  error: '\uB274\uC2A4 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.',
  retry: '\uB2E4\uC2DC \uC2DC\uB3C4',
  featured: '\uC8FC\uC694 \uB274\uC2A4',
};

function StatusPanel({ message, onRetry }) {
  return (
    <Card hover={false} className="flex min-h-48 flex-col items-center justify-center p-6 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-[var(--color-primary-soft)] text-sm font-black text-[var(--color-primary)]">i</span>
      <p className="mt-3 text-sm font-bold text-[var(--color-text-secondary)]">{message}</p>
      {onRetry && <button type="button" onClick={onRetry} className="mt-4 rounded-full bg-[var(--color-primary-soft)] px-4 py-2 text-sm font-bold text-[var(--color-primary)] hover:bg-blue-100">{t.retry}</button>}
    </Card>
  );
}

function NewsSkeleton() {
  return (
    <Card hover={false} className="p-5">
      <div className="divide-y divide-[var(--color-border)]">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="animate-pulse py-4 first:pt-0 last:pb-0">
            <div className="h-4 w-24 rounded-full bg-slate-100" />
            <div className="mt-3 h-5 w-4/5 rounded bg-slate-100" />
            <div className="mt-2 h-4 w-full rounded bg-slate-100" />
            <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function NewsItem({ item, featured, onOpen }) {
  return (
    <article className="group relative">
      <button
        type="button"
        onClick={() => onOpen?.(item)}
        className="block w-full rounded-2xl px-3 py-4 text-left transition hover:bg-[var(--color-surface-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
      >
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {featured && <span className="rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-xs font-bold text-[var(--color-primary)]">{t.featured}</span>}
              {item.category && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-[var(--color-text-secondary)]">{item.category}</span>}
              {item.time && <span className="text-xs font-medium text-[var(--color-text-tertiary)]">{item.time}</span>}
            </div>
            <h3 className={`mt-3 line-clamp-2 font-extrabold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] ${featured ? 'text-lg leading-7' : 'text-base leading-6'}`}>
              {item.title}
            </h3>
            {item.summary && <p className={`mt-2 line-clamp-2 text-sm leading-6 text-[var(--color-text-secondary)] ${featured ? 'sm:line-clamp-3' : ''}`}>{item.summary}</p>}
          </div>
          {item.image && (
            <img
              src={item.image}
              alt={item.title}
              className="h-24 w-full rounded-2xl object-cover sm:w-32"
              onError={(event) => { event.currentTarget.style.display = 'none'; }}
            />
          )}
        </div>
      </button>
    </article>
  );
}

export default function NewsList({ onOpenDetail, limit = null, showMore = false, contained = true }) {
  const { query } = useSearch();
  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ['news'], queryFn: getNews });
  const keyword = query.trim().toLowerCase();
  const filtered = data.filter((item) => !keyword || [item.title, item.summary, item.category].join(' ').toLowerCase().includes(keyword));
  const news = limit ? filtered.slice(0, limit) : filtered;
  const isPage = contained && !limit && !showMore;
  const content = (
    <>
      {isPage ? <PageHeader eyebrow="콘텐츠" title={t.pageTitle} description={t.pageDescription} /> : <QuoteSectionHeader title={t.title} description={t.description} action={showMore && <Link to="/news" className="text-sm font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">{t.more}</Link>} />}
      {isPage && <ResultToolbar count={news.length} query={query} label="뉴스" />}
      {isLoading && <NewsSkeleton />}
      {error && <StatusPanel message={t.error} onRetry={refetch} />}
      {!isLoading && !error && (
        news.length === 0 ? <StatusPanel message={keyword ? t.searchEmpty : t.empty} /> : (
          <Card hover={false} className="p-2">
            <div className="divide-y divide-[var(--color-border)]">
              {news.map((item, index) => <NewsItem key={item.id} item={item} featured={index === 0} onOpen={onOpenDetail} />)}
            </div>
          </Card>
        )
      )}
    </>
  );

  if (!contained) return <section id="news" className="min-w-0">{content}</section>;

  return (
    <section id="news" className="py-7">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{content}</div>
    </section>
  );
}
