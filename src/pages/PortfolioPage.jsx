import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavoritesStore } from '../store/favoritesStore';
import { getCryptoPrices, getUsStocks } from '../services/api';
import SectionHeader from '../components/SectionHeader';

const numericPrice = (price) => Number(String(price).replace(/[^0-9.]/g, '')) || 0;

export default function PortfolioPage() {
  const { user } = useAuth();
  const favorites = useFavoritesStore((state) => state.favorites);
  const crypto = useQuery({ queryKey: ['crypto'], queryFn: getCryptoPrices });
  const stocks = useQuery({ queryKey: ['stocks', 'us'], queryFn: getUsStocks });
  const assets = [
    ...(crypto.data || []).map((item) => ({ ...item, favoriteKey: `crypto:${item.id}` })),
    ...(stocks.data || []).map((item) => ({ ...item, favoriteKey: `stock:${item.id}` })),
  ].filter((item) => favorites.includes(item.favoriteKey));
  const total = assets.reduce((sum, item) => sum + numericPrice(item.price), 0);

  if (!user) return <section className="py-12"><div className="max-w-4xl mx-auto px-4 text-center"><SectionHeader title="포트폴리오" description="로그인 후 관심 자산을 한눈에 확인하세요." /><Link to="/" className="text-blue-400">메인 화면에서 로그인하기</Link></div></section>;

  return (
    <section className="py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title="포트폴리오" description={`${user.username}님의 관심 자산 요약입니다.`} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="rounded-lg border border-gray-700 bg-gray-900 p-6"><p className="text-gray-400 text-sm">관심 자산 수</p><p className="text-3xl font-bold text-white mt-2">{assets.length}</p></div>
          <div className="rounded-lg border border-gray-700 bg-gray-900 p-6"><p className="text-gray-400 text-sm">단순 합산 기준가</p><p className="text-3xl font-bold text-white mt-2">${total.toLocaleString()}</p></div>
        </div>
        {assets.length === 0 ? <div className="rounded-lg border border-gray-700 bg-gray-900 p-8 text-gray-300">즐겨찾기에 자산을 추가하면 이곳에서 요약을 확인할 수 있습니다.</div> : <div className="rounded-lg border border-gray-700 bg-gray-900 divide-y divide-gray-700">{assets.map((item) => <div key={`${item.symbol || item.name}-${item.id}`} className="flex justify-between gap-4 p-4"><div><p className="text-white font-bold">{item.symbol || item.name}</p><p className="text-gray-400 text-sm">{item.name}</p></div><div className="text-right"><p className="text-white">{item.price}</p><p className={item.isPositive ? 'text-green-400' : 'text-red-400'}>{item.change}</p></div></div>)}</div>}
      </div>
    </section>
  );
}
