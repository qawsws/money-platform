import { useLocation } from 'react-router-dom'
import { useParams, useNavigate } from 'react-router-dom'
import DetailModal from '../components/DetailModal'
import { useEffect, useState } from 'react'
import * as api from '../services/api'

export default function DetailPage() {
  const { type, id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [item, setItem] = useState(location.state?.item ?? null);

  useEffect(() => {
    if (item) return;

    // Fallback: fetch single item by type/id if not provided through navigation state
    async function fetchItem() {
      try {
        let res = null
        switch (type) {
          case 'market':
            res = await api.getMarketIndices();
            break;
          case 'crypto':
            res = await api.getCryptoPrices();
            break;
          case 'stock':
            res = await api.getUsStocks();
            break;
          case 'news':
            res = await api.getNews();
            break;
          case 'community':
            res = await api.getCommunityPosts();
            break;
          default:
            res = [];
        }

        const found = Array.isArray(res) ? res.find((x) => String(x.id) === String(decodeURIComponent(id)) || String(x.symbol) === decodeURIComponent(id) || String(x.title) === decodeURIComponent(id)) : null;
        setItem(found || null);
      } catch (err) {
        console.error('Failed to load detail item', err);
      }
    }

    fetchItem();
  }, [type, id, item]);

  const close = () => navigate(-1);

  if (!item) return <div className="p-8 text-white">상세 정보를 불러오는 중입니다.</div>;

  return <DetailModal open={true} type={type} item={item} onClose={close} />;
}
