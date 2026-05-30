import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavoritesStore } from '../store/favoritesStore';
import { getCryptoPrices, getUsStocks } from '../services/api';
import SectionHeader from '../components/SectionHeader';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorMessage from '../components/ErrorMessage';

export default function FavoritesPage() {
  const { user } = useAuth();
  const favorites = useFavoritesStore((state) => state.favorites);
  const navigate = useNavigate();
  const crypto = useQuery({ queryKey: ['crypto'], queryFn: getCryptoPrices });
  const stocks = useQuery({ queryKey: ['stocks', 'us'], queryFn: getUsStocks });
  const favoriteCryptos = (crypto.data || []).filter((item) => favorites.includes(`crypto:${item.id}`));
  const favoriteStocks = (stocks.data || []).filter((item) => favorites.includes(`stock:${item.id}`));
  const openDetail = (type, item) => navigate(`/detail/${type}/${item.id}`, { state: { item } });

  if (!user) return <section className="py-12"><div className="max-w-4xl mx-auto px-4 text-center text-white"><SectionHeader title="즐겨찾기" description="로그인 후 나만의 즐겨찾기를 확인할 수 있습니다." /><div className="mt-10 rounded-lg border border-gray-700 bg-gray-900 p-10 text-gray-300">로그인하면 코인과 주식 즐겨찾기를 사용자별로 저장할 수 있습니다.</div></div></section>;

  return (
    <section className="py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title="즐겨찾기" description={`${user.username}님의 관심 종목입니다.`} />
        <FavoriteSection title="암호화폐" query={crypto} empty="즐겨찾기에 추가한 암호화폐가 없습니다.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{favoriteCryptos.map((item) => <button key={item.id} type="button" onClick={() => openDetail('crypto', item)} className="text-left bg-gray-800 rounded-lg p-6 border border-gray-700"><h3 className="text-white font-bold">{item.name}</h3><p className="text-gray-400 text-sm mb-3">{item.symbol}</p><p className="text-white text-xl">{item.price}</p><p className={item.isPositive ? 'text-green-400' : 'text-red-400'}>{item.change}</p></button>)}</div>
        </FavoriteSection>
        <FavoriteSection title="미국 주식" query={stocks} empty="즐겨찾기에 추가한 주식이 없습니다.">
          <div className="space-y-4">{favoriteStocks.map((item) => <button key={item.id} type="button" onClick={() => openDetail('stock', item)} className="w-full text-left bg-gray-800 rounded-lg p-4 border border-gray-700 flex justify-between gap-4"><div><p className="text-white font-bold">{item.symbol} · {item.name}</p><p className="text-gray-400 text-sm">{item.description}</p></div><div className="text-right"><p className="text-white">{item.price}</p><p className={item.isPositive ? 'text-green-400' : 'text-red-400'}>{item.change}</p></div></button>)}</div>
        </FavoriteSection>
      </div>
    </section>
  );
}

function FavoriteSection({ title, query, empty, children }) {
  const isEmpty = !query.isLoading && !query.error && children.props.children.length === 0;
  return <div className="mb-8 border border-gray-700 bg-gray-900 p-6 rounded-lg"><h2 className="text-xl font-semibold text-white mb-4">{title}</h2>{query.isLoading && <LoadingSkeleton className="p-6 h-24" />}{query.error && <ErrorMessage error={query.error} />}{isEmpty && <p className="text-gray-400">{empty}</p>}{children}</div>;
}
