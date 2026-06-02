import { useQuery } from '@tanstack/react-query';
import { getMarketIndices } from '../services/api';
import ErrorMessage from './ErrorMessage';
import LoadingSkeleton from './LoadingSkeleton';
import SectionHeader from './SectionHeader';

const t = { title: '\uC624\uB298\uC758 \uC2DC\uC7A5', description: '\uC8FC\uC694 \uC9C0\uC218\uC758 \uD750\uB984\uC744 \uD55C\uB208\uC5D0 \uD655\uC778\uD558\uC138\uC694.' };

export default function MarketIndex({ onOpenDetail }) {
  const { data = [], isLoading, error } = useQuery({ queryKey: ['market', 'indices'], queryFn: getMarketIndices });
  return <section id="market" className="py-7"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeader title={t.title} description={t.description} />{isLoading && <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[1, 2, 3, 4].map((id) => <LoadingSkeleton key={id} className="h-28 p-4" />)}</div>}{error && <ErrorMessage error={error} />}{!isLoading && !error && <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{data.map((item) => <button type="button" key={item.id} onClick={() => onOpenDetail?.(item)} className="rounded-md border border-slate-200 bg-white p-4 text-left hover:border-blue-300 hover:shadow-sm"><div className="flex justify-between gap-2 text-sm text-slate-500"><span>{item.name}</span><span>{item.icon}</span></div><p className="mt-3 text-xl font-bold text-slate-950">{item.value}</p><p className={`mt-1 text-sm font-semibold ${item.isPositive ? 'text-red-500' : 'text-blue-600'}`}>{item.change}</p></button>)}</div>}</div></section>;
}
