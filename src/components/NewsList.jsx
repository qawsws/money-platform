import { useQuery } from '@tanstack/react-query';
import { useSearch } from '../context/SearchContext';
import { getNews } from '../services/api';
import ErrorMessage from './ErrorMessage';
import LoadingSkeleton from './LoadingSkeleton';
import SectionHeader from './SectionHeader';

const t = { title: '\uCD5C\uC2E0 \uB274\uC2A4', description: '\uC2DC\uC7A5\uC744 \uC6C0\uC9C1\uC774\uB294 \uC8FC\uC694 \uC774\uC288\uB97C \uD655\uC778\uD558\uC138\uC694.', empty: '\uAC80\uC0C9\uC5B4\uC640 \uC77C\uCE58\uD558\uB294 \uB274\uC2A4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.' };

export default function NewsList({ onOpenDetail }) {
  const { query } = useSearch();
  const { data = [], isLoading, error } = useQuery({ queryKey: ['news'], queryFn: getNews });
  const keyword = query.trim().toLowerCase();
  const news = data.filter((item) => !keyword || [item.title, item.summary, item.category].join(' ').toLowerCase().includes(keyword));
  return <section id="news" className="py-7"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeader title={t.title} description={t.description} />{isLoading && <LoadingSkeleton className="h-60 p-5" />}{error && <ErrorMessage error={error} />}{!isLoading && !error && (news.length === 0 ? <div className="rounded-md border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">{t.empty}</div> : <div className="divide-y divide-slate-100 overflow-hidden rounded-md border border-slate-200 bg-white">{news.map((item) => <article key={item.id} onClick={() => onOpenDetail?.(item)} className="cursor-pointer px-4 py-4 hover:bg-slate-50"><div className="flex flex-wrap items-center gap-2 text-xs"><span className="font-semibold text-blue-600">{item.category}</span><span className="text-slate-400">{item.time}</span></div><h3 className="mt-2 font-bold text-slate-900">{item.title}</h3><p className="mt-1 text-sm text-slate-500">{item.summary}</p></article>)}</div>)}</div></section>;
}
