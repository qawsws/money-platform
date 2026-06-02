import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSkeleton from '../components/LoadingSkeleton';
import SectionHeader from '../components/SectionHeader';
import { useAuth } from '../context/AuthContext';
import { getCryptoPrices, getUsStocks } from '../services/api';
import { useFavoritesStore } from '../store/favoritesStore';

const t = { title: '\uC990\uACA8\uCC3E\uAE30', guest: '\uB85C\uADF8\uC778 \uD6C4 \uAD00\uC2EC \uC885\uBAA9\uC744 \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.', crypto: '\uC554\uD638\uD654\uD3D0', stocks: '\uBBF8\uAD6D \uC8FC\uC2DD', empty: '\uC544\uC9C1 \uCD94\uAC00\uD55C \uC885\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.' };

export default function FavoritesPage() {
  const { user } = useAuth(); const favorites = useFavoritesStore((state) => state.favorites); const navigate = useNavigate();
  const crypto = useQuery({ queryKey: ['crypto'], queryFn: getCryptoPrices }); const stocks = useQuery({ queryKey: ['stocks', 'us'], queryFn: getUsStocks });
  const coins = (crypto.data || []).filter((item) => favorites.includes(`crypto:${item.id}`)); const shares = (stocks.data || []).filter((item) => favorites.includes(`stock:${item.id}`));
  const open = (type, item) => navigate(`/detail/${type}/${item.id}`, { state: { item } });
  if (!user) return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><SectionHeader title={t.title} description={t.guest} /></main>;
  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><SectionHeader title={t.title} description={`${user.username}\uB2D8\uC774 \uC800\uC7A5\uD55C \uAD00\uC2EC \uC885\uBAA9\uC785\uB2C8\uB2E4.`} /><Group title={t.crypto} query={crypto} empty={t.empty}>{coins.map((item) => <Asset key={item.id} item={item} onClick={() => open('crypto', item)} />)}</Group><Group title={t.stocks} query={stocks} empty={t.empty}>{shares.map((item) => <Asset key={item.id} item={item} onClick={() => open('stock', item)} />)}</Group></main>;
}
function Group({ title, query, empty, children }) { return <section className="mb-5 overflow-hidden rounded-md border border-slate-200 bg-white"><h2 className="border-b border-slate-200 bg-slate-50 px-4 py-3 font-bold">{title}</h2>{query.isLoading && <LoadingSkeleton className="m-4 h-20 p-4" />}{query.error && <div className="p-4"><ErrorMessage error={query.error} /></div>}{!query.isLoading && !query.error && children.length === 0 && <p className="p-6 text-sm text-slate-500">{empty}</p>}<div className="divide-y divide-slate-100">{children}</div></section>; }
function Asset({ item, onClick }) { return <button type="button" onClick={onClick} className="flex w-full justify-between gap-4 px-4 py-4 text-left hover:bg-slate-50"><div><b>{item.symbol || item.name}</b><p className="text-sm text-slate-500">{item.name}</p></div><div className="text-right"><b>{item.price}</b><p className={`text-sm ${item.isPositive ? 'text-red-500' : 'text-blue-600'}`}>{item.change}</p></div></button>; }
