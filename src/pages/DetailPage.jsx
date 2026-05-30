import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import DetailModal from '../components/DetailModal';
import * as api from '../services/api';

const loaders = {
  market: api.getMarketIndices,
  crypto: api.getCryptoPrices,
  stock: api.getUsStocks,
  news: api.getNews,
  community: api.getCommunityPosts,
};

export default function DetailPage() {
  const { type, id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [item, setItem] = useState(location.state?.item ?? null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (item) return;
    async function fetchItem() {
      try {
        const data = await (loaders[type]?.() ?? Promise.resolve([]));
        const decodedId = decodeURIComponent(id);
        const found = data.find((entry) => [entry.id, entry.symbol, entry.title].some((value) => String(value) === decodedId));
        setItem(found || null);
        if (!found) setError('상세 정보를 찾을 수 없습니다.');
      } catch {
        setError('상세 정보를 불러오지 못했습니다.');
      }
    }
    fetchItem();
  }, [id, item, type]);

  if (error) return <div className="p-8 text-white">{error}</div>;
  if (!item) return <div className="p-8 text-white">상세 정보를 불러오는 중입니다.</div>;
  return <DetailModal open type={type} item={item} onClose={() => navigate(-1)} />;
}
