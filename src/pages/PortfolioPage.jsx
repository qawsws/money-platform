import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import SectionHeader from '../components/SectionHeader';
import { useAuth } from '../context/AuthContext';
import { getCryptoPrices, getUsStocks } from '../services/api';
import { useFavoritesStore } from '../store/favoritesStore';

const t = { title: '\uD3EC\uD2B8\uD3F4\uB9AC\uC624', login: '\uB85C\uADF8\uC778 \uD6C4 \uAD00\uC2EC \uC790\uC0B0\uC744 \uD655\uC778\uD558\uC138\uC694.', go: '\uBA54\uC778\uC5D0\uC11C \uB85C\uADF8\uC778\uD558\uAE30', count: '\uAD00\uC2EC \uC790\uC0B0', total: '\uB2E8\uC21C \uD569\uC0B0 \uAE30\uC900\uAC00', empty: '\uC990\uACA8\uCC3E\uAE30\uC5D0 \uC790\uC0B0\uC744 \uCD94\uAC00\uD558\uBA74 \uC774\uACF3\uC5D0\uC11C \uC694\uC57D\uC744 \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.' };
const price = (value) => Number(String(value).replace(/[^0-9.]/g, '')) || 0;

export default function PortfolioPage() {
  const { user } = useAuth(); const favorites = useFavoritesStore((state) => state.favorites);
  const crypto = useQuery({ queryKey: ['crypto'], queryFn: getCryptoPrices }); const stocks = useQuery({ queryKey: ['stocks', 'us'], queryFn: getUsStocks });
  const assets = [...(crypto.data || []).map((item) => ({ ...item, key: `crypto:${item.id}` })), ...(stocks.data || []).map((item) => ({ ...item, key: `stock:${item.id}` }))].filter((item) => favorites.includes(item.key));
  if (!user) return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><SectionHeader title={t.title} description={t.login} /><Link to="/" className="text-sm font-semibold text-blue-600">{t.go}</Link></main>;
  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><SectionHeader title={t.title} description={`${user.username}\uB2D8\uC758 \uAD00\uC2EC \uC790\uC0B0 \uC694\uC57D\uC785\uB2C8\uB2E4.`} /><div className="mb-5 grid gap-3 sm:grid-cols-2"><Summary label={t.count} value={assets.length} /><Summary label={t.total} value={`$${assets.reduce((sum, item) => sum + price(item.price), 0).toLocaleString()}`} /></div>{assets.length === 0 ? <p className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">{t.empty}</p> : <div className="divide-y divide-slate-100 overflow-hidden rounded-md border border-slate-200 bg-white">{assets.map((item) => <div key={item.key} className="flex justify-between px-4 py-4"><div><b>{item.symbol || item.name}</b><p className="text-sm text-slate-500">{item.name}</p></div><div className="text-right"><b>{item.price}</b><p className={`text-sm ${item.isPositive ? 'text-red-500' : 'text-blue-600'}`}>{item.change}</p></div></div>)}</div>}</main>;
}
function Summary({ label, value }) { return <div className="rounded-md border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>; }
