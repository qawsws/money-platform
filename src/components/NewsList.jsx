import { useQuery } from '@tanstack/react-query';
import SectionHeader from './SectionHeader';
import { getNews } from '../services/api';
import { useSearch } from '../context/SearchContext';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorMessage from './ErrorMessage';

const importance = {
  high: ['중요', 'bg-red-500/20 text-red-300'],
  medium: ['보통', 'bg-yellow-500/20 text-yellow-300'],
  low: ['일반', 'bg-gray-600/20 text-gray-300'],
};

export default function NewsList({ onOpenDetail }) {
  const { query } = useSearch();
  const { data = [], isLoading, error } = useQuery({ queryKey: ['news'], queryFn: getNews });
  const normalizedQuery = query.trim().toLowerCase();
  const filteredNews = data.filter((item) => !normalizedQuery || [item.title, item.summary, item.category].join(' ').toLowerCase().includes(normalizedQuery));

  return (
    <section id="news" className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title="최신 뉴스" description="투자 관련 주요 뉴스를 확인하세요." />
        {isLoading && <div className="space-y-3">{[1, 2, 3].map((id) => <LoadingSkeleton key={id} className="p-5 h-24" />)}</div>}
        {error && <ErrorMessage error={error} />}
        {!isLoading && !error && (
          <>
            {normalizedQuery && <div className="mb-4 text-sm text-gray-300">검색어: <span className="text-white">{query}</span> ({filteredNews.length}개 결과)</div>}
            {filteredNews.length === 0 ? <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 text-center text-gray-300">검색어와 일치하는 뉴스가 없습니다.</div> : (
              <div className="space-y-3">{filteredNews.map((news) => {
                const [label, color] = importance[news.importance] || importance.low;
                return <article key={news.id} onClick={() => onOpenDetail?.(news)} className="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:border-gray-600 cursor-pointer"><div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"><div><h3 className="text-white font-bold text-lg mb-2">{news.title}</h3><p className="text-gray-400 text-sm mb-3">{news.summary}</p><div className="flex gap-3"><span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">{news.category}</span><span className="text-gray-500 text-xs">{news.time}</span></div></div><span className={`self-start px-3 py-1 rounded-full text-xs font-bold ${color}`}>{label}</span></div></article>;
              })}</div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
