import { useQuery } from '@tanstack/react-query';
import { getCryptoPrices } from '../services/api';
import { useFavoritesStore } from '../store/favoritesStore';
import ErrorMessage from './ErrorMessage';
import LoadingSkeleton from './LoadingSkeleton';
import SectionHeader from './SectionHeader';

const t = { title: '\uC554\uD638\uD654\uD3D0', description: '\uC8FC\uC694 \uCF54\uC778\uC758 \uD604\uC7AC \uAC00\uACA9\uACFC \uBCC0\uB3D9\uB960\uC744 \uD655\uC778\uD558\uC138\uC694.', favorite: '\uC990\uACA8\uCC3E\uAE30' };

export default function CoinPrice({ onOpenDetail }) {
  const { data = [], isLoading, error } = useQuery({ queryKey: ['crypto'], queryFn: getCryptoPrices });
  const favorites = useFavoritesStore((state) => state.favorites);
  const toggle = useFavoritesStore((state) => state.toggle);
  return <section id="crypto" className="py-7"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeader title={t.title} description={t.description} />{isLoading && <div className="grid gap-3 md:grid-cols-3">{[1, 2, 3].map((id) => <LoadingSkeleton key={id} className="h-32 p-4" />)}</div>}{error && <ErrorMessage error={error} />}{!isLoading && !error && <div className="grid gap-3 md:grid-cols-3">{data.map((coin) => <div key={coin.id} onClick={() => onOpenDetail?.(coin)} className="cursor-pointer rounded-md border border-slate-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-bold text-blue-600">{coin.image}</p><h3 className="mt-2 font-bold text-slate-950">{coin.name}</h3><p className="text-xs text-slate-400">{coin.symbol}</p></div><button type="button" aria-label={`${coin.name} ${t.favorite}`} onClick={(event) => { event.stopPropagation(); toggle(`crypto:${coin.id}`); }} className="text-xl text-amber-400">{favorites.includes(`crypto:${coin.id}`) ? '\u2605' : '\u2606'}</button></div><div className="mt-4 flex items-end justify-between gap-3"><p className="text-xl font-bold">{coin.price}</p><p className={`text-sm font-semibold ${coin.isPositive ? 'text-red-500' : 'text-blue-600'}`}>{coin.change}</p></div></div>)}</div>}</div></section>;
}
