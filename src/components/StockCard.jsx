import { useQuery } from '@tanstack/react-query';
import { useSearch } from '../context/SearchContext';
import { getUsStocks } from '../services/api';
import { useFavoritesStore } from '../store/favoritesStore';
import ErrorMessage from './ErrorMessage';
import LoadingSkeleton from './LoadingSkeleton';
import SectionHeader from './SectionHeader';

const t = { title: '\uC778\uAE30 \uBBF8\uAD6D \uC8FC\uC2DD', description: '\uB9CE\uC740 \uD22C\uC790\uC790\uAC00 \uAD00\uC2EC\uC744 \uAC16\uB294 \uC885\uBAA9\uC744 \uC0B4\uD3B4\uBCF4\uC138\uC694.', symbol: '\uC885\uBAA9', price: '\uD604\uC7AC\uAC00', change: '\uBCC0\uB3D9\uB960', favorite: '\uC990\uACA8\uCC3E\uAE30', empty: '\uAC80\uC0C9\uC5B4\uC640 \uC77C\uCE58\uD558\uB294 \uC885\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.', result: '\uAC80\uC0C9 \uACB0\uACFC' };

export default function StockCard({ onOpenDetail }) {
  const { data = [], isLoading, error } = useQuery({ queryKey: ['stocks', 'us'], queryFn: getUsStocks });
  const { query } = useSearch();
  const favorites = useFavoritesStore((state) => state.favorites);
  const toggle = useFavoritesStore((state) => state.toggle);
  const normalizedQuery = query.trim().toLowerCase();
  const stocks = data.filter((stock) => !normalizedQuery || [stock.symbol, stock.name, stock.description].join(' ').toLowerCase().includes(normalizedQuery));
  const Favorite = ({ stock }) => <button type="button" aria-label={`${stock.name} ${t.favorite}`} onClick={(event) => { event.stopPropagation(); toggle(`stock:${stock.id}`); }} className="text-lg text-amber-400">{favorites.includes(`stock:${stock.id}`) ? '\u2605' : '\u2606'}</button>;

  return <section id="stocks" className="py-7"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeader title={t.title} description={t.description} />{isLoading && <LoadingSkeleton className="h-64 p-5" />}{error && <ErrorMessage error={error} />}{!isLoading && !error && <>{normalizedQuery && <p className="mb-3 text-sm text-slate-500">{t.result}: <b className="text-slate-800">{query}</b> ({stocks.length})</p>}{stocks.length === 0 ? <div className="rounded-md border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">{t.empty}</div> : <div className="overflow-hidden rounded-md border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500"><tr><th className="px-4 py-3">{t.symbol}</th><th className="px-4 py-3">{'\uC124\uBA85'}</th><th className="px-4 py-3 text-right">{t.price}</th><th className="px-4 py-3 text-right">{t.change}</th><th className="px-4 py-3 text-right">{t.favorite}</th></tr></thead><tbody>{stocks.map((stock) => <tr key={stock.id} onClick={() => onOpenDetail?.(stock)} className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-blue-50/50"><td className="px-4 py-4"><b>{stock.symbol}</b><p className="text-xs text-slate-400">{stock.name}</p></td><td className="px-4 py-4 text-slate-500">{stock.description}</td><td className="px-4 py-4 text-right font-bold">{stock.price}</td><td className={`px-4 py-4 text-right font-semibold ${stock.isPositive ? 'text-red-500' : 'text-blue-600'}`}>{stock.change}</td><td className="px-4 py-4 text-right"><Favorite stock={stock} /></td></tr>)}</tbody></table></div></div>}</>}</div></section>;
}
