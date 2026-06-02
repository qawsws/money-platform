import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import DetailModal from '../components/DetailModal';
import * as api from '../services/api';

const loaders = { market: api.getMarketIndices, crypto: api.getCryptoPrices, stock: api.getUsStocks, news: api.getNews, community: api.getCommunityPosts };

export default function DetailPage() {
  const { type, id } = useParams(); const location = useLocation(); const navigate = useNavigate();
  const [item, setItem] = useState(location.state?.item ?? null); const [error, setError] = useState(null);
  useEffect(() => {
    if (item) return;
    async function load() {
      try {
        const data = await (loaders[type]?.() ?? Promise.resolve([])); const decoded = decodeURIComponent(id);
        const found = data.find((entry) => [entry.id, entry.symbol, entry.title].some((value) => String(value) === decoded));
        setItem(found || null); if (!found) setError('\uC0C1\uC138 \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.');
      } catch { setError('\uC0C1\uC138 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.'); }
    }
    load();
  }, [id, item, type]);
  if (error) return <div className="p-8 text-slate-700">{error}</div>;
  if (!item) return <div className="p-8 text-slate-500">{'\uC0C1\uC138 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4.'}</div>;
  return <DetailModal open type={type} item={item} onClose={() => navigate(-1)} />;
}
