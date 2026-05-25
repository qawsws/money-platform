// MarketIndex 컴포넌트 - 주요 시장 지수 표시
// 주식시장의 주요 지수를 카드 형태로 보여줍니다

// MarketIndex는 서비스 레이어를 통해 데이터를 가져오도록 변경합니다.
import SectionHeader from './SectionHeader';
import { useQuery } from '@tanstack/react-query'
import { getMarketIndices } from '../services/api';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorMessage from './ErrorMessage';

export default function MarketIndex({ onOpenDetail }) {
  // API에서 지수 목록을 가져옵니다.
  const { data = [], isLoading: loading, error } = useQuery(['market', 'indices'], getMarketIndices);

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title="📊 주요 시장 지수" description="실시간 시장 지표를 확인하세요" />

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <LoadingSkeleton className="p-6 h-28" />
            <LoadingSkeleton className="p-6 h-28" />
            <LoadingSkeleton className="p-6 h-28" />
            <LoadingSkeleton className="p-6 h-28" />
          </div>
        )}

        {error && <ErrorMessage error={error} />}

        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.map((index) => (
              <div
                key={index.id}
                onClick={() => onOpenDetail?.(index)}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-300 font-medium">{index.name}</h3>
                  <span className="text-2xl">{index.icon}</span>
                </div>

                <p className="text-2xl font-bold text-white mb-2">{index.value}</p>

                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full ${
                    index.isPositive ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                  }`}
                >
                  <span className="text-sm font-medium">{index.isPositive ? '↑' : '↓'} {index.change}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
