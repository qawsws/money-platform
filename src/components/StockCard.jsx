// StockCard 컴포넌트 - 미국 주식 정보 표시
// Apple, Google, Microsoft 등의 미국 주식 정보를 보여줍니다

// StockCard는 서비스 레이어에서 데이터를 가져오도록 변경했습니다.
import SectionHeader from './SectionHeader';
import { useQuery } from '@tanstack/react-query'
import { getUsStocks } from '../services/api';
import { useFavoritesStore } from '../store/favoritesStore';
import { useState, useEffect } from 'react';
import { useSearch } from '../context/SearchContext';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorMessage from './ErrorMessage';

export default function StockCard({ onOpenDetail }) {
  // API 호출을 통해 미국 주식 데이터를 가져옵니다.
  const { data = [], isLoading: loading, error } = useQuery(['stocks', 'us'], getUsStocks);
  const { query } = useSearch();
  const favorites = useFavoritesStore((s) => s.favorites);
  const toggle = useFavoritesStore((s) => s.toggle);

  const [, setLocal] = useState(favorites);

  useEffect(() => {
    setLocal(favorites);
  }, [favorites]);

  const handleToggleFavorite = (id) => {
    toggle(id);
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filteredStocks = data
    ? data.filter((stock) => {
        if (!normalizedQuery) return true;
        return [stock.symbol, stock.name, stock.description]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      })
    : [];

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="📈 인기 미국 주식"
          description="가장 많은 관심을 받는 미국 주식들"
        />

        {/* 로딩, 에러, 데이터 렌더링을 순차적으로 처리 */}
        {loading && (
          <div className="space-y-3 p-4">
            <LoadingSkeleton className="p-4 h-20" />
            <LoadingSkeleton className="p-4 h-20" />
            <LoadingSkeleton className="p-4 h-20" />
          </div>
        )}

        {error && <ErrorMessage error={error} />}

        {data && (
          <>
            {normalizedQuery && (
              <div className="mb-4 text-sm text-gray-300">
                검색어: <span className="text-white">{query}</span> ({filteredStocks.length}개 결과)
              </div>
            )}
            {filteredStocks.length === 0 ? (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 text-center text-gray-300">
                검색어에 맞는 종목이 없습니다.
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  {/* 데스크톱: 테이블 */}
                  <div className="hidden md:block min-w-full">
                    <table className="w-full">
                      <thead className="bg-gray-900 border-b border-gray-700">
                        <tr>
                          <th className="px-6 py-4 text-left text-gray-300 font-semibold">종목</th>
                          <th className="px-6 py-4 text-left text-gray-300 font-semibold">설명</th>
                          <th className="px-6 py-4 text-right text-gray-300 font-semibold">현재가</th>
                          <th className="px-6 py-4 text-right text-gray-300 font-semibold">변동률</th>
                          <th className="px-6 py-4 text-right text-gray-300 font-semibold">즐겨찾기</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStocks.map((stock, index) => (
                          <tr
                            key={stock.id}
                            onClick={() => onOpenDetail?.(stock)}
                            className={`border-b border-gray-700 hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer ${
                              index === filteredStocks.length - 1 ? 'border-b-0' : ''
                            }`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                                  <span className="text-blue-400 font-bold text-sm">{stock.symbol.charAt(0)}</span>
                                </div>
                                <div>
                                  <p className="text-white font-semibold">{stock.symbol}</p>
                                  <p className="text-gray-400 text-sm">{stock.name}</p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-gray-400">{stock.description}</td>

                            <td className="px-6 py-4 text-right">
                              <p className="text-white font-bold text-lg">{stock.price}</p>
                            </td>

                            <td className="px-6 py-4 text-right">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full font-medium ${
                                  stock.isPositive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                                }`}
                              >
                                {stock.isPositive ? '↑' : '↓'} {stock.change}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <button onClick={(event) => { event.stopPropagation(); handleToggleFavorite(stock.id); }} className="text-yellow-400">
                                {isFavorite(stock.id) ? '★' : '☆'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 모바일: 카드 리스트 */}
                  <div className="md:hidden space-y-3 p-4">
                    {filteredStocks.map((stock) => (
                      <div key={stock.id} onClick={() => onOpenDetail?.(stock)} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 cursor-pointer hover:border-gray-500 transition-colors duration-200">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                              <span className="text-blue-400 font-bold">{stock.symbol.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="text-white font-semibold">{stock.symbol}</p>
                              <p className="text-gray-400 text-sm">{stock.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`font-medium ${stock.isPositive ? 'text-green-300' : 'text-red-300'}`}>{stock.isPositive ? '↑' : '↓'} {stock.change}</span>
                            <button onClick={(event) => { event.stopPropagation(); handleToggleFavorite(stock.id); }} className="text-yellow-400">{isFavorite(stock.id) ? '★' : '☆'}</button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-gray-400 text-sm">{stock.description}</p>
                          <p className="text-white font-bold">{stock.price}</p>
                        </div>
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
