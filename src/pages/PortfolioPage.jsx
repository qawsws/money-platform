import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSkeleton from '../components/LoadingSkeleton';
import SectionHeader from '../components/SectionHeader';
import { useAuth } from '../context/AuthContext';
import { deletePortfolioHolding, getCryptoPrices, getPortfolio, getUsStocks, savePortfolioHolding } from '../services/api';

const t = {
  title: '포트폴리오',
  login: '로그인 후 보유 자산을 관리할 수 있습니다.',
  go: '메인에서 로그인하기',
  empty: '아직 등록한 보유 자산이 없습니다.',
  asset: '자산',
  quantity: '수량',
  average: '평균 매수가',
  add: '저장',
  remove: '삭제',
  count: '보유 자산',
  cost: '매수 원금',
  value: '평가 금액',
  profit: '평가 손익',
};

const token = () => localStorage.getItem('mp_token') || '';
const price = (value) => Number(String(value).replace(/[^0-9.]/g, '')) || 0;
const money = (value) => `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function PortfolioPage() {
  const { user } = useAuth();
  const client = useQueryClient();
  const [form, setForm] = useState({ itemKey: '', quantity: '', averagePrice: '' });
  const crypto = useQuery({ queryKey: ['crypto'], queryFn: getCryptoPrices });
  const stocks = useQuery({ queryKey: ['stocks', 'us'], queryFn: getUsStocks });
  const portfolio = useQuery({ queryKey: ['portfolio'], queryFn: () => getPortfolio(token()), enabled: Boolean(user) });

  const assets = useMemo(() => [
    ...(crypto.data || []).map((item) => ({ ...item, itemKey: `crypto:${item.id}`, assetType: 'crypto' })),
    ...(stocks.data || []).map((item) => ({ ...item, itemKey: `stock:${item.id}`, assetType: 'stock' })),
  ], [crypto.data, stocks.data]);
  const selected = assets.find((item) => item.itemKey === form.itemKey);
  const holdings = portfolio.data?.holdings || [];
  const rows = holdings.map((holding) => {
    const current = assets.find((item) => item.itemKey === holding.itemKey);
    const currentPrice = price(current?.price);
    const cost = holding.quantity * holding.averagePrice;
    const value = holding.quantity * currentPrice;
    return { ...holding, currentPrice, cost, value, profit: value - cost, change: current?.change };
  });
  const totalCost = rows.reduce((sum, item) => sum + item.cost, 0);
  const totalValue = rows.reduce((sum, item) => sum + item.value, 0);

  const refresh = () => client.invalidateQueries({ queryKey: ['portfolio'] });
  const save = useMutation({
    mutationFn: () => savePortfolioHolding(token(), {
      itemKey: selected.itemKey,
      assetType: selected.assetType,
      symbol: selected.symbol || selected.name,
      name: selected.name,
      quantity: form.quantity,
      averagePrice: form.averagePrice,
    }),
    onSuccess: () => { setForm({ itemKey: '', quantity: '', averagePrice: '' }); refresh(); },
  });
  const remove = useMutation({ mutationFn: (itemKey) => deletePortfolioHolding(token(), itemKey), onSuccess: refresh });

  if (!user) return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><SectionHeader title={t.title} description={t.login} /><Link to="/" className="text-sm font-semibold text-blue-600">{t.go}</Link></main>;

  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <SectionHeader title={t.title} description={`${user.username}님의 실제 보유 자산 기준 요약입니다.`} />
    <div className="mb-5 grid gap-3 sm:grid-cols-4">
      <Summary label={t.count} value={rows.length} />
      <Summary label={t.cost} value={money(totalCost)} />
      <Summary label={t.value} value={money(totalValue)} />
      <Summary label={t.profit} value={money(totalValue - totalCost)} tone={totalValue - totalCost >= 0 ? 'text-red-500' : 'text-blue-600'} />
    </div>
    <form onSubmit={(event) => { event.preventDefault(); if (selected) save.mutate(); }} className="mb-5 grid gap-3 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-[2fr_1fr_1fr_auto]">
      <label className="text-sm font-semibold text-slate-600">{t.asset}<select value={form.itemKey} onChange={(event) => setForm((prev) => ({ ...prev, itemKey: event.target.value }))} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"><option value="">선택</option>{assets.map((item) => <option key={item.itemKey} value={item.itemKey}>{item.symbol || item.name} - {item.name}</option>)}</select></label>
      <label className="text-sm font-semibold text-slate-600">{t.quantity}<input value={form.quantity} onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))} min="0" step="any" type="number" className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900" /></label>
      <label className="text-sm font-semibold text-slate-600">{t.average}<input value={form.averagePrice} onChange={(event) => setForm((prev) => ({ ...prev, averagePrice: event.target.value }))} min="0" step="any" type="number" className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900" /></label>
      <button type="submit" disabled={!selected || save.isPending} className="self-end rounded-md bg-blue-600 px-4 py-2 font-semibold text-white disabled:bg-slate-300">{t.add}</button>
    </form>
    {save.error && <ErrorMessage error={save.error} />}
    {portfolio.isLoading && <LoadingSkeleton className="h-32 p-4" />}
    {portfolio.error && <ErrorMessage error={portfolio.error} />}
    {!portfolio.isLoading && !portfolio.error && rows.length === 0 && <p className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">{t.empty}</p>}
    {rows.length > 0 && <div className="overflow-hidden rounded-md border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500"><tr><th className="px-4 py-3">{t.asset}</th><th className="px-4 py-3 text-right">{t.quantity}</th><th className="px-4 py-3 text-right">{t.average}</th><th className="px-4 py-3 text-right">현재가</th><th className="px-4 py-3 text-right">{t.value}</th><th className="px-4 py-3 text-right">{t.profit}</th><th className="px-4 py-3 text-right"></th></tr></thead><tbody>{rows.map((item) => <tr key={item.itemKey} className="border-b border-slate-100 last:border-0"><td className="px-4 py-4"><b>{item.symbol}</b><p className="text-xs text-slate-500">{item.name}</p></td><td className="px-4 py-4 text-right">{item.quantity}</td><td className="px-4 py-4 text-right">{money(item.averagePrice)}</td><td className="px-4 py-4 text-right">{money(item.currentPrice)}</td><td className="px-4 py-4 text-right font-bold">{money(item.value)}</td><td className={`px-4 py-4 text-right font-semibold ${item.profit >= 0 ? 'text-red-500' : 'text-blue-600'}`}>{money(item.profit)}</td><td className="px-4 py-4 text-right"><button type="button" onClick={() => remove.mutate(item.itemKey)} className="text-slate-400 hover:text-red-500">{t.remove}</button></td></tr>)}</tbody></table></div></div>}
  </main>;
}

function Summary({ label, value, tone = 'text-slate-950' }) {
  return <div className="rounded-md border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className={`mt-2 text-xl font-bold ${tone}`}>{value}</p></div>;
}
