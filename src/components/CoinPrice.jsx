import { useQuery } from '@tanstack/react-query';
import SectionHeader from './SectionHeader';
import { getCryptoPrices } from '../services/api';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorMessage from './ErrorMessage';
import { useFavoritesStore } from '../store/favoritesStore';

export default function CoinPrice({ onOpenDetail }) {
  const { data = [], isLoading, error } = useQuery({ queryKey: ['crypto'], queryFn: getCryptoPrices });
  const favorites = useFavoritesStore((s) => s.favorites);
  const toggle = useFavoritesStore((s) => s.toggle);

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title="암호화폐 시세" description="주요 암호화폐의 실시간 가격을 확인하세요." />
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((id) => <LoadingSkeleton key={id} className="p-6 h-36" />)}
          </div>
        )}
        {error && <ErrorMessage error={error} />}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.map((coin) => (
              <div key={coin.id} onClick={() => onOpenDetail?.(coin)} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-blue-300">{coin.image}</span>
                    <div><h3 className="text-white font-bold">{coin.name}</h3><p className="text-gray-400 text-sm">{coin.symbol}</p></div>
                  </div>
                  <button type="button" aria-label={`${coin.name} 즐겨찾기`} onClick={(event) => { event.stopPropagation(); toggle(`crypto:${coin.id}`); }} className="text-yellow-400">
                    {favorites.includes(`crypto:${coin.id}`) ? '★' : '☆'}
                  </button>
                </div>
                <p className="text-2xl font-bold text-white mb-3">{coin.price}</p>
                <div className={`inline-flex items-center px-4 py-2 rounded-lg font-medium ${coin.isPositive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                  <span>{coin.isPositive ? '▲' : '▼'}</span><span className="ml-2">{coin.change}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
