import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import DetailModal from '../components/DetailModal';
import Card from '../components/ui/Card';
import * as api from '../services/api';

const loaders = { market: api.getMarketIndices, crypto: api.getCryptoPrices, stock: api.getUsStocks, 'korean-stock': api.getKoreanStocks, news: api.getNews, community: api.getCommunityPosts };

export default function DetailPage() {
  const { type, id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [item, setItem] = useState(location.state?.item ?? null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (item) return;
    async function load() {
      try {
        const data = await (loaders[type]?.() ?? Promise.resolve([]));
        const decoded = decodeURIComponent(id);
        const found = data.find((entry) => [entry.id, entry.symbol, entry.title].some((value) => String(value) === decoded));
        setItem(found || null);
        if (!found) setError('상세 정보를 찾을 수 없습니다.');
      } catch {
        setError('상세 정보를 불러오지 못했습니다.');
      }
    }
    load();
  }, [id, item, type]);

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card hover={false} className="p-6 text-center sm:p-8">
          <p className="text-lg font-extrabold text-[var(--color-text-primary)]">{error}</p>
          <button type="button" onClick={() => navigate(-1)} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white transition hover:bg-[var(--color-primary-hover)]">목록으로 돌아가기</button>
        </Card>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card hover={false} className="p-6 sm:p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-40 rounded-full bg-slate-200" />
            <div className="h-24 rounded-3xl bg-slate-200" />
            <div className="h-72 rounded-3xl bg-slate-200" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 rounded-3xl bg-slate-200" />)}
            </div>
          </div>
        </Card>
      </main>
    );
  }

  return <DetailModal open type={type} item={item} standalone={!location.state?.background} onClose={() => navigate(-1)} />;
}
