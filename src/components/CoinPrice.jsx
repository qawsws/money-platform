// CoinPrice 컴포넌트 - 암호화폐 시세 표시
// Bitcoin, Ethereum 등의 주요 암호화폐 가격을 보여줍니다

// 이제는 서비스 레이어에서 데이터를 가져옵니다. 실제 API로 전환하기 쉬운 구조입니다.
import SectionHeader from './SectionHeader';
import { useQuery } from '@tanstack/react-query'
import { getCryptoPrices } from '../services/api';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorMessage from './ErrorMessage';
import { useFavoritesStore } from '../store/favoritesStore';

export default function CoinPrice({ onOpenDetail }) {
  const { data = [], isLoading: loading, error } = useQuery(['crypto'], getCryptoPrices);
  const favorites = useFavoritesStore((s) => s.favorites);
  const toggle = useFavoritesStore((s) => s.toggle);

  const handleToggleFavorite = (id) => {
    toggle(id);
  };

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="🪙 암호화폐 시세"
          description="주요 암호화폐의 실시간 가격"
        />

        {/* 로딩 상태: 스켈레톤으로 자리 표시 */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LoadingSkeleton className="p-6 h-36" />
            <LoadingSkeleton className="p-6 h-36" />
            <LoadingSkeleton className="p-6 h-36" />
          </div>
        )}

        {/* 에러 상태: 간단한 메시지 출력 */}
        {error && <ErrorMessage error={error} />}

        {/* 정상 데이터 렌더링 */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.map((coin) => (
              <div
                key={coin.id}
                onClick={() => onOpenDetail?.(coin)}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                {/* 코인명과 심볼 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{coin.image}</span>
                    <div>
                      <h3 className="text-white font-bold">{coin.name}</h3>
                      <p className="text-gray-400 text-sm">{coin.symbol}</p>
                    </div>
                  </div>
                    <button onClick={(event) => { event.stopPropagation(); handleToggleFavorite(coin.id); }} className="text-yellow-400">{favorites.includes(coin.id) ? '★' : '☆'}</button>
                </div>

                {/* 코인 가격 */}
                <p className="text-2xl font-bold text-white mb-3">{coin.price}</p>

                {/* 변동률 배지 */}
                <div
                  className={`inline-flex items-center px-4 py-2 rounded-lg font-medium ${
                    coin.isPositive
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  <span>{coin.isPositive ? '📈' : '📉'}</span>
                  <span className="ml-2">{coin.change}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
