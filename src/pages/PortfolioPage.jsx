import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSkeleton from '../components/LoadingSkeleton';
import SectionHeader from '../components/SectionHeader';
import { useAuth } from '../context/AuthContext';
import { deletePortfolioHolding, getCryptoPrices, getPortfolio, getUsStocks, savePortfolioHolding } from '../services/api';

const t = {
  title: '\uD3EC\uD2B8\uD3F4\uB9AC\uC624',
  login: '\uB85C\uADF8\uC778 \uD6C4 \uBCF4\uC720 \uC790\uC0B0\uC744 \uAD00\uB9AC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
  go: '\uBA54\uC778\uC5D0\uC11C \uB85C\uADF8\uC778\uD558\uAE30',
  empty: '\uC544\uC9C1 \uB4F1\uB85D\uD55C \uBCF4\uC720 \uC790\uC0B0\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.',
  asset: '\uC790\uC0B0',
  quantity: '\uC218\uB7C9',
  average: '\uD3C9\uADE0 \uB9E4\uC218\uAC00',
  save: '\uC800\uC7A5',
  edit: '\uC218\uC815',
  remove: '\uC0AD\uC81C',
  reset: '\uC785\uB825 \uCD08\uAE30\uD654',
  count: '\uBCF4\uC720 \uC790\uC0B0',
  cost: '\uB9E4\uC218 \uC6D0\uAE08',
  value: '\uD3C9\uAC00 \uAE08\uC561',
  profit: '\uD3C9\uAC00 \uC190\uC775',
  rate: '\uC218\uC775\uB960',
  current: '\uD604\uC7AC\uAC00',
  selectedPrice: '\uC120\uD0DD \uC790\uC0B0 \uD604\uC7AC\uAC00',
  useCurrent: '\uD604\uC7AC\uAC00 \uC785\uB825',
};

const token = () => localStorage.getItem('mp_token') || '';
const price = (value) => Number(String(value).replace(/[^0-9.]/g, '')) || 0;
const money = (value) => `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const percent = (value) => `${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
const blankForm = { itemKey: '', quantity: '', averagePrice: '' };

export default function PortfolioPage() {
  const { user } = useAuth();
  const client = useQueryClient();
  const [form, setForm] = useState(blankForm);
  const crypto = useQuery({ queryKey: ['crypto'], queryFn: getCryptoPrices });
  const stocks = useQuery({ queryKey: ['stocks', 'us'], queryFn: getUsStocks });
  const portfolio = useQuery({ queryKey: ['portfolio'], queryFn: () => getPortfolio(token()), enabled: Boolean(user) });

  const assets = useMemo(() => [
    ...(crypto.data || []).map((item) => ({ ...item, itemKey: `crypto:${item.id}`, assetType: 'crypto' })),
    ...(stocks.data || []).map((item) => ({ ...item, itemKey: `stock:${item.id}`, assetType: 'stock' })),
  ], [crypto.data, stocks.data]);
  const selected = assets.find((item) => item.itemKey === form.itemKey);
  const selectedPrice = price(selected?.price);
  const holdings = portfolio.data?.holdings || [];
  const rows = holdings.map((holding) => {
    const current = assets.find((item) => item.itemKey === holding.itemKey);
    const currentPrice = price(current?.price);
    const cost = holding.quantity * holding.averagePrice;
    const value = holding.quantity * currentPrice;
    const profit = value - cost;
    const profitRate = cost > 0 ? (profit / cost) * 100 : 0;
    return { ...holding, currentPrice, cost, value, profit, profitRate, change: current?.change };
  });
  const totalCost = rows.reduce((sum, item) => sum + item.cost, 0);
  const totalValue = rows.reduce((sum, item) => sum + item.value, 0);
  const totalProfit = totalValue - totalCost;
  const totalRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

  const refresh = () => client.invalidateQueries({ queryKey: ['portfolio'] });
  const reset = () => setForm(blankForm);
  const save = useMutation({
    mutationFn: () => savePortfolioHolding(token(), {
      itemKey: selected.itemKey,
      assetType: selected.assetType,
      symbol: selected.symbol || selected.name,
      name: selected.name,
      quantity: form.quantity,
      averagePrice: form.averagePrice,
    }),
    onSuccess: () => { reset(); refresh(); },
  });
  const remove = useMutation({ mutationFn: (itemKey) => deletePortfolioHolding(token(), itemKey), onSuccess: refresh });
  const canSave = Boolean(selected) && Number(form.quantity) > 0 && Number(form.averagePrice) >= 0 && !save.isPending;

  if (!user) {
    return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><SectionHeader title={t.title} description={t.login} /><Link to="/" className="text-sm font-semibold text-blue-600">{t.go}</Link></main>;
  }

  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <SectionHeader title={t.title} description={`${user.username}\uB2D8\uC758 \uC2E4\uC81C \uBCF4\uC720 \uC790\uC0B0 \uAE30\uC900 \uC694\uC57D\uC785\uB2C8\uB2E4.`} />
    <div className="mb-5 grid gap-3 sm:grid-cols-5">
      <Summary label={t.count} value={rows.length} />
      <Summary label={t.cost} value={money(totalCost)} />
      <Summary label={t.value} value={money(totalValue)} />
      <Summary label={t.profit} value={money(totalProfit)} tone={totalProfit >= 0 ? 'text-red-500' : 'text-blue-600'} />
      <Summary label={t.rate} value={percent(totalRate)} tone={totalProfit >= 0 ? 'text-red-500' : 'text-blue-600'} />
    </div>
    <form onSubmit={(event) => { event.preventDefault(); if (canSave) save.mutate(); }} className="mb-5 grid gap-3 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-[2fr_1fr_1fr_auto_auto]">
      <label className="text-sm font-semibold text-slate-600">{t.asset}<select value={form.itemKey} onChange={(event) => setForm((prev) => ({ ...prev, itemKey: event.target.value }))} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"><option value="">\uC120\uD0DD</option>{assets.map((item) => <option key={item.itemKey} value={item.itemKey}>{item.symbol || item.name} - {item.name}</option>)}</select></label>
      <label className="text-sm font-semibold text-slate-600">{t.quantity}<input value={form.quantity} onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))} min="0" step="any" type="number" className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900" /></label>
      <label className="text-sm font-semibold text-slate-600">{t.average}<input value={form.averagePrice} onChange={(event) => setForm((prev) => ({ ...prev, averagePrice: event.target.value }))} min="0" step="any" type="number" className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900" /></label>
      <button type="submit" disabled={!canSave} className="self-end rounded-md bg-blue-600 px-4 py-2 font-semibold text-white disabled:bg-slate-300">{t.save}</button>
      <button type="button" onClick={reset} className="self-end rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">{t.reset}</button>
      {selected && <p className="text-sm text-slate-500 md:col-span-5">{t.selectedPrice}: <b className="text-slate-900">{money(selectedPrice)}</b> <button type="button" onClick={() => setForm((prev) => ({ ...prev, averagePrice: String(selectedPrice) }))} className="ml-2 font-semibold text-blue-600">{t.useCurrent}</button></p>}
    </form>
    {save.error && <ErrorMessage error={save.error} />}
    {portfolio.isLoading && <LoadingSkeleton className="h-32 p-4" />}
    {portfolio.error && <ErrorMessage error={portfolio.error} />}
    {!portfolio.isLoading && !portfolio.error && rows.length === 0 && <p className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">{t.empty}</p>}
    {rows.length > 0 && <div className="overflow-hidden rounded-md border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[860px] text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500"><tr><th className="px-4 py-3">{t.asset}</th><th className="px-4 py-3 text-right">{t.quantity}</th><th className="px-4 py-3 text-right">{t.average}</th><th className="px-4 py-3 text-right">{t.current}</th><th className="px-4 py-3 text-right">{t.value}</th><th className="px-4 py-3 text-right">{t.profit}</th><th className="px-4 py-3 text-right">{t.rate}</th><th className="px-4 py-3 text-right"></th></tr></thead><tbody>{rows.map((item) => <tr key={item.itemKey} className="border-b border-slate-100 last:border-0"><td className="px-4 py-4"><b>{item.symbol}</b><p className="text-xs text-slate-500">{item.name}</p></td><td className="px-4 py-4 text-right">{item.quantity}</td><td className="px-4 py-4 text-right">{money(item.averagePrice)}</td><td className="px-4 py-4 text-right">{money(item.currentPrice)}</td><td className="px-4 py-4 text-right font-bold">{money(item.value)}</td><td className={`px-4 py-4 text-right font-semibold ${item.profit >= 0 ? 'text-red-500' : 'text-blue-600'}`}>{money(item.profit)}</td><td className={`px-4 py-4 text-right font-semibold ${item.profit >= 0 ? 'text-red-500' : 'text-blue-600'}`}>{percent(item.profitRate)}</td><td className="px-4 py-4 text-right"><button type="button" onClick={() => setForm({ itemKey: item.itemKey, quantity: String(item.quantity), averagePrice: String(item.averagePrice) })} className="mr-3 text-slate-500 hover:text-blue-600">{t.edit}</button><button type="button" onClick={() => remove.mutate(item.itemKey)} className="text-slate-400 hover:text-red-500">{t.remove}</button></td></tr>)}</tbody></table></div></div>}
  </main>;
}

function Summary({ label, value, tone = 'text-slate-950' }) {
  return <div className="rounded-md border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className={`mt-2 text-xl font-bold ${tone}`}>{value}</p></div>;
}
