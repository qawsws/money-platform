// NewsList 컴포넌트 - 투자 관련 뉴스 표시
// 경제, 기업, 암호화폐 등 다양한 뉴스를 카테고리별로 보여줍니다

// NewsList는 API에서 뉴스를 받아오도록 변경합니다.
import SectionHeader from './SectionHeader';
import { useQuery } from '@tanstack/react-query'
import { getNews } from '../services/api';
import { useSearch } from '../context/SearchContext';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorMessage from './ErrorMessage';

// 중요도에 따른 색상을 반환하는 헬퍼 함수
const getImportanceColor = (importance) => {
  switch (importance) {
    case 'high':
      return 'bg-red-500/20 text-red-300';
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-300';
    case 'low':
      return 'bg-gray-600/20 text-gray-300';
    default:
      return 'bg-gray-600/20 text-gray-300';
  }
};

export default function NewsList({ onOpenDetail }) {
  // API에서 뉴스 목록을 가져옵니다.
  const { query } = useSearch();
  const { data = [], isLoading: loading, error } = useQuery(['news'], getNews);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredNews = data
    ? data.filter((item) => {
        if (!normalizedQuery) return true;
        return [item.title, item.summary, item.category]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      })
    : [];

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="📰 최신 뉴스"
          description="투자 관련 주요 뉴스를 확인하세요"
        />

        {loading && (
          <div className="space-y-3">
            <LoadingSkeleton className="p-5 h-24" />
            <LoadingSkeleton className="p-5 h-24" />
            <LoadingSkeleton className="p-5 h-24" />
          </div>
        )}

        {error && <ErrorMessage error={error} />}

        {data && (
          <>
            {normalizedQuery && (
              <div className="mb-4 text-sm text-gray-300">
                검색어: <span className="text-white">{query}</span> ({filteredNews.length}개 결과)
              </div>
            )}
            {filteredNews.length === 0 ? (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 text-center text-gray-300">
                검색어에 맞는 뉴스가 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNews.map((news) => (
                  <article
                    key={news.id}
                    onClick={() => onOpenDetail?.(news)}
                    className="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:border-gray-600 hover:shadow-lg transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg mb-2 hover:text-blue-400 transition-colors">{news.title}</h3>
                        <p className="text-gray-400 text-sm mb-3">{news.summary}</p>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">{news.category}</span>
                          <span className="text-gray-500 text-xs">{news.time}</span>
                        </div>
                      </div>

                      <div className="flex md:justify-end">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getImportanceColor(news.importance)}`}>
                          {news.importance === 'high' ? '⚠️ 중요' : news.importance === 'medium' ? '⭐ 보통' : '📌 일반'}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => filteredNews[0] && onOpenDetail?.(filteredNews[0])}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            모든 뉴스 보기
          </button>
        </div>
      </div>
    </section>
  );
}
