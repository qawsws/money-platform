import { useQuery } from '@tanstack/react-query';
import SectionHeader from './SectionHeader';
import { getUsStocks } from '../services/api';
import { useFavoritesStore } from '../store/favoritesStore';
import { useSearch } from '../context/SearchContext';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorMessage from './ErrorMessage';

export default function StockCard({ onOpenDetail }) {
  const { data = [], isLoading, error } = useQuery({ queryKey: ['stocks', 'us'], queryFn: getUsStocks });
  const { query } = useSearch();
  const favorites = useFavoritesStore((s) => s.favorites);
  const toggle = useFavoritesStore((s) => s.toggle);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredStocks = data.filter((stock) => (
    !normalizedQuery || [stock.symbol, stock.name, stock.description].join(' ').toLowerCase().includes(normalizedQuery)
  ));

  const FavoriteButton = ({ stock }) => (
    <button
      type="button"
      aria-label={`${stock.name} 즐겨찾기`}
      onClick={(event) => { event.stopPropagation(); toggle(`stock:${stock.id}`); }}
      className="text-yellow-400"
    >
      {favorites.includes(`stock:${stock.id}`) ? '★' : '☆'}
    </button>
  );

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title="인기 미국 주식" description="관심을 많이 받는 미국 주식을 확인하세요." />
        {isLoading && <div className="space-y-3 p-4">{[1, 2, 3].map((id) => <LoadingSkeleton key={id} className="p-4 h-20" />)}</div>}
        {error && <ErrorMessage error={error} />}
        {!isLoading && !error && (
          <>
            {normalizedQuery && <div className="mb-4 text-sm text-gray-300">검색어: <span className="text-white">{query}</span> ({filteredStocks.length}개 결과)</div>}
            {filteredStocks.length === 0 ? (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 text-center text-gray-300">검색어와 일치하는 종목이 없습니다.</div>
            ) : (
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="hidden md:block min-w-full">
                    <table className="w-full">
                      <thead className="bg-gray-900 border-b border-gray-700">
                        <tr>
                          <th className="px-6 py-4 text-left text-gray-300 font-semibold">종목</th><th className="px-6 py-4 text-left text-gray-300 font-semibold">설명</th><th className="px-6 py-4 text-right text-gray-300 font-semibold">현재가</th><th className="px-6 py-4 text-right text-gray-300 font-semibold">변동률</th><th className="px-4 py-4 text-right text-gray-300 font-semibold">즐겨찾기</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStocks.map((stock) => (
                          <tr key={stock.id} onClick={() => onOpenDetail?.(stock)} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer">
                            <td className="px-6 py-4"><p className="text-white font-semibold">{stock.symbol}</p><p className="text-gray-400 text-sm">{stock.name}</p></td>
                            <td className="px-6 py-4 text-gray-400">{stock.description}</td><td className="px-6 py-4 text-right text-white font-bold text-lg">{stock.price}</td>
                            <td className="px-6 py-4 text-right"><span className={`inline-flex items-center px-3 py-1 rounded-full font-medium ${stock.isPositive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{stock.isPositive ? '▲' : '▼'} {stock.change}</span></td>
                            <td className="px-4 py-4 text-right"><FavoriteButton stock={stock} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="md:hidden space-y-3 p-4">
                    {filteredStocks.map((stock) => (
                      <div key={stock.id} onClick={() => onOpenDetail?.(stock)} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 cursor-pointer">
                        <div className="flex justify-between gap-4 mb-3"><div><p className="text-white font-semibold">{stock.symbol}</p><p className="text-gray-400 text-sm">{stock.name}</p></div><FavoriteButton stock={stock} /></div>
                        <div className="flex justify-between gap-4"><p className="text-gray-400 text-sm">{stock.description}</p><div className="text-right"><p className="text-white font-bold">{stock.price}</p><p className={stock.isPositive ? 'text-green-300' : 'text-red-300'}>{stock.change}</p></div></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
