import { useQuery } from '@tanstack/react-query';
import SectionHeader from './SectionHeader';
import { getMarketIndices } from '../services/api';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorMessage from './ErrorMessage';

export default function MarketIndex({ onOpenDetail }) {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['market', 'indices'],
    queryFn: getMarketIndices,
  });

  return (
    <section id="market" className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title="주요 시장 지수" description="실시간 시장 지수를 확인하세요." />
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((id) => <LoadingSkeleton key={id} className="p-6 h-28" />)}
          </div>
        )}
        {error && <ErrorMessage error={error} />}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.map((index) => (
              <button
                type="button"
                key={index.id}
                onClick={() => onOpenDetail?.(index)}
                className="text-left bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-300 font-medium">{index.name}</h3>
                  <span className="text-sm font-bold text-blue-300">{index.icon}</span>
                </div>
                <p className="text-2xl font-bold text-white mb-2">{index.value}</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${index.isPositive ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
                  {index.isPositive ? '▲' : '▼'} {index.change}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
