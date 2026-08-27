import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import AssetIcon from '../components/ui/AssetIcon';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import PriceChangeBadge from '../components/ui/PriceChangeBadge';
import { useAuth } from '../context/AuthContext';
import { deletePortfolioHolding, getCryptoPrices, getKoreanStocks, getPortfolio, getUsStocks, postPortfolioAiAnalysis, requestInvestmentInsights, savePortfolioHolding } from '../services/api';

const USD_TO_KRW_RATE = 1380;
const blankForm = { itemKey: '', quantity: '', averagePrice: '' };
const assetTypeLabel = { crypto: '암호화폐', stock: '미국 주식', 'korean-stock': '한국 주식' };
const allocationColors = ['bg-emerald-500', 'bg-sky-500', 'bg-indigo-500', 'bg-amber-500', 'bg-slate-500'];

const token = () => localStorage.getItem('mp_token') || '';
const parsePrice = (value) => Number(String(value || '').replace(/[^0-9.]/g, '')) || 0;
const toKrw = (value, assetType) => Number(value || 0) * (assetType === 'korean-stock' ? 1 : USD_TO_KRW_RATE);
const krw = (value) => `₩${Number(value || 0).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}`;
const assetMoney = (value, assetType) => assetType === 'korean-stock'
  ? krw(value)
  : `$${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
const percent = (value) => `${Number(value || 0).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}%`;

function toneClass(value) {
  if (value > 0) return 'text-[var(--color-positive)]';
  if (value < 0) return 'text-[var(--color-negative)]';
  return 'text-[var(--color-text-secondary)]';
}

function SummaryCard({ label, value, description, tone = 'text-[var(--color-text-primary)]', featured = false }) {
  return (
    <Card hover={false} className={`flex min-h-32 flex-col justify-between p-5 ${featured ? 'sm:col-span-2' : ''}`}>
      <div>
        <p className="text-sm font-bold text-[var(--color-text-secondary)]">{label}</p>
        <p className={`mt-3 break-words text-2xl font-black tracking-tight ${featured ? 'sm:text-4xl' : 'sm:text-3xl'} ${tone}`}>{value}</p>
      </div>
      {description && <p className="mt-4 text-xs font-medium text-[var(--color-text-tertiary)]">{description}</p>}
    </Card>
  );
}

function StatusCard({ title, description, action }) {
  return (
    <Card hover={false} className="grid min-h-64 place-items-center p-8 text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-[var(--color-primary-soft)] text-sm font-black text-[var(--color-primary)]">P</span>
        <h2 className="mt-4 text-lg font-extrabold text-[var(--color-text-primary)]">{title}</h2>
        {description && <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>}
        {action}
      </div>
    </Card>
  );
}

function LoadingBlocks() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-[var(--radius-card)] bg-slate-200" />)}
      </div>
      <div className="h-80 animate-pulse rounded-[var(--radius-card)] bg-slate-200" />
    </div>
  );
}

function AllocationPanel({ rows }) {
  if (rows.length === 0) {
    return (
      <Card hover={false} className="p-5">
        <h2 className="text-lg font-black text-[var(--color-text-primary)]">자산 구성</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">자산을 추가하면 비중이 표시됩니다.</p>
      </Card>
    );
  }

  return (
    <Card hover={false} className="p-5">
      <h2 className="text-lg font-black text-[var(--color-text-primary)]">자산 구성</h2>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">현재 평가금액 기준 비중입니다.</p>
      <div className="mt-5 space-y-4">
        {rows.map((item, index) => (
          <div key={item.itemKey}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm font-bold">
              <span className="truncate text-[var(--color-text-primary)]">{item.symbol}</span>
              <span className="text-[var(--color-text-secondary)]">{percent(item.allocation)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full ${allocationColors[index % allocationColors.length]}`} style={{ width: `${Math.min(100, item.allocation)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function HoldingForm({ assets, form, selected, selectedPrice, canSave, save, reset, setForm }) {
  return (
    <Card hover={false} className="p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-black text-[var(--color-text-primary)]">자산 추가 및 수정</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">보유 수량과 평균 매수가를 입력하면 평가금액에 반영됩니다.</p>
      </div>
      <form className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(160px,0.5fr)_minmax(160px,0.7fr)_auto]" onSubmit={(event) => { event.preventDefault(); if (canSave) save.mutate(); }}>
        <label className="block min-w-0">
          <span className="text-sm font-bold text-[var(--color-text-primary)]">자산</span>
          <select value={form.itemKey} onChange={(event) => setForm((prev) => ({ ...prev, itemKey: event.target.value }))} className="mt-2 h-12 w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 text-sm font-bold text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none">
            <option value="">자산을 선택하세요</option>
            {assets.map((item) => (
              <option key={item.itemKey} value={item.itemKey}>{item.symbol || item.name} · {item.name} · {assetTypeLabel[item.assetType]}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-bold text-[var(--color-text-primary)]">수량</span>
          <input type="number" min="0" step="any" value={form.quantity} onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))} className="mt-2 h-12 w-full rounded-2xl border border-[var(--color-border)] px-4 text-sm font-bold focus:border-[var(--color-primary)] focus:outline-none" />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-[var(--color-text-primary)]">평균 매수가</span>
          <input type="number" min="0" step="any" value={form.averagePrice} onChange={(event) => setForm((prev) => ({ ...prev, averagePrice: event.target.value }))} className="mt-2 h-12 w-full rounded-2xl border border-[var(--color-border)] px-4 text-sm font-bold focus:border-[var(--color-primary)] focus:outline-none" />
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" disabled={!canSave} className="inline-flex h-12 min-w-24 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:bg-slate-300">
            {save.isPending ? '저장 중' : '저장'}
          </button>
          <button type="button" onClick={reset} className="inline-flex h-12 items-center justify-center rounded-2xl border border-[var(--color-border)] px-4 text-sm font-bold text-[var(--color-text-secondary)] hover:bg-slate-50">초기화</button>
        </div>
      </form>
      {selected && <p className="mt-4 text-sm font-semibold text-[var(--color-text-secondary)]">선택 자산 현재가: {assetMoney(selectedPrice, selected.assetType)}</p>}
    </Card>
  );
}

function HoldingsTable({ rows, remove, setForm }) {
  return (
    <Card hover={false} className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-[960px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black text-[var(--color-text-secondary)]">
            <tr>
              <th className="px-5 py-4">자산</th>
              <th className="px-5 py-4 text-right">수량</th>
              <th className="px-5 py-4 text-right">평균 매수가</th>
              <th className="px-5 py-4 text-right">현재가</th>
              <th className="px-5 py-4 text-right">평가금액</th>
              <th className="px-5 py-4 text-right">비중</th>
              <th className="px-5 py-4 text-right">수익금</th>
              <th className="px-5 py-4 text-right">수익률</th>
              <th className="px-5 py-4 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {rows.map((item) => (
              <tr key={item.itemKey} className="bg-white">
                <td className="px-5 py-5">
                  <div className="flex items-center gap-3">
                    <AssetIcon symbol={item.symbol} />
                    <div className="min-w-0">
                      <p className="font-black text-[var(--color-text-primary)]">{item.symbol}</p>
                      <p className="text-xs font-semibold text-[var(--color-text-secondary)]">{item.name}</p>
                      <p className="text-xs font-black text-[var(--color-primary)]">{assetTypeLabel[item.assetType]}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-5 text-right font-bold">{Number(item.quantity).toLocaleString('ko-KR')}</td>
                <td className="px-5 py-5 text-right font-bold">{assetMoney(item.averagePrice, item.assetType)}</td>
                <td className="px-5 py-5 text-right font-bold">{assetMoney(item.currentPrice, item.assetType)}</td>
                <td className="px-5 py-5 text-right font-black">{krw(item.valueKrw)}</td>
                <td className="px-5 py-5 text-right font-black">{percent(item.allocation)}</td>
                <td className={`px-5 py-5 text-right font-black ${toneClass(item.profitKrw)}`}>{krw(item.profitKrw)}</td>
                <td className="px-5 py-5 text-right"><PriceChangeBadge change={percent(item.profitRate)} isPositive={item.profitKrw >= 0} /></td>
                <td className="px-5 py-5 text-right">
                  <button type="button" onClick={() => setForm({ itemKey: item.itemKey, quantity: String(item.quantity), averagePrice: String(item.averagePrice) })} className="mr-3 font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">수정</button>
                  <button type="button" onClick={() => { if (window.confirm('이 보유 자산을 삭제할까요?')) remove.mutate(item.itemKey); }} className="font-bold text-red-500 hover:text-red-600">삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ListBox({ title, items }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-slate-50 p-4">
      <h4 className="text-sm font-extrabold text-[var(--color-text-primary)]">{title}</h4>
      {items?.length > 0 ? <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-text-secondary)]">{items.map((item) => <li key={item}>- {item}</li>)}</ul> : <p className="mt-3 text-sm text-[var(--color-text-tertiary)]">-</p>}
    </div>
  );
}

function AiPortfolioPanel({ analysis, cached, onRerun, rerunning }) {
  if (!analysis?.result) return null;
  const { basis, generatedAt, result } = analysis;
  const largest = result.composition?.largestPosition;
  return (
    <Card hover={false} className="p-5 sm:p-6">
      <div className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">AI Portfolio</p>
          <h2 className="mt-1 text-xl font-black text-[var(--color-text-primary)]">AI 포트폴리오 분석</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">{result.overallSummary}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {cached && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-[var(--color-text-secondary)]">캐시 사용</span>}
          <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">생성 시간: {new Date(generatedAt).toLocaleString()}</span>
          <button type="button" onClick={onRerun} disabled={rerunning} className="inline-flex min-h-9 items-center justify-center rounded-full bg-[var(--color-primary)] px-3 text-xs font-bold text-white transition hover:bg-[var(--color-primary-hover)] disabled:bg-slate-300">{rerunning ? '분석 중' : '다시 분석'}</button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCell label="총 평가금액" value={krw(basis.totalEvaluation)} strong />
        <InfoCell label="총 수익금" value={krw(basis.totalProfit)} tone={toneClass(basis.totalProfit)} strong />
        <InfoCell label="총 수익률" value={percent(basis.totalReturnRate)} tone={toneClass(basis.totalProfit)} strong />
        <InfoCell label="상위 3개 비중" value={percent(result.composition?.topPositionsWeight)} strong />
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">자산 구성</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{result.composition?.summary}</p>
          {largest && <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-lg font-black text-[var(--color-text-primary)]">{largest.symbol} · {largest.name} · {percent(largest.weight)}</p>}
        </div>
        <ListBox title="긍정적인 부분" items={result.strengths} />
        <ListBox title="현재 수익 현황" items={[result.performance?.summary, ...(result.performance?.positiveContributors || []), ...(result.performance?.negativeContributors || [])].filter(Boolean)} />
        <ListBox title="확인할 사항" items={result.checkpoints} />
      </div>
      <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">{result.disclaimer}</p>
    </Card>
  );
}

function InvestmentInsightsPanel({ insights, onRerun, rerunning }) {
  const result = insights.result || {};
  return (
    <Card hover={false} className="p-5 sm:p-6">
      <div className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">AI Investment</p>
          <h2 className="mt-1 text-xl font-black text-[var(--color-text-primary)]">AI 투자 인사이트</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">{result.summary}</p>
        </div>
        <button type="button" onClick={onRerun} disabled={rerunning} className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--color-primary)] px-4 text-sm font-bold text-white transition hover:bg-[var(--color-primary-hover)] disabled:bg-slate-300">{rerunning ? '생성 중' : '다시 보기'}</button>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <ListBox title="핵심 확인 사항" items={(result.highlights || []).map((item) => `${item.title}: ${item.description}`)} />
        <ListBox title="포트폴리오 관찰" items={[result.portfolioObservation].filter(Boolean)} />
        <ListBox title="뉴스 관찰" items={[result.newsObservation].filter(Boolean)} />
        <ListBox title="위험 점검" items={result.riskChecks} />
      </div>
      {result.disclaimer && <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">{result.disclaimer}</p>}
    </Card>
  );
}

function InfoCell({ label, value, tone = 'text-[var(--color-text-primary)]', strong = false }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold text-[var(--color-text-tertiary)]">{label}</p>
      <p className={`mt-2 break-words ${strong ? 'text-lg font-black' : 'text-sm font-bold'} ${tone}`}>{value}</p>
    </div>
  );
}

function AiErrorBox({ error, onRetry }) {
  const message = error?.code === 'AI_DISABLED'
    ? 'AI 기능이 현재 비활성화되어 있습니다.'
    : error?.code === 'DAILY_LIMIT_EXCEEDED'
      ? '오늘 사용할 수 있는 AI 분석 횟수를 모두 사용했습니다.'
      : error?.message || 'AI 요청을 완료하지 못했습니다.';
  return (
    <Card hover={false} className="border-amber-200 bg-amber-50 p-5">
      <p className="text-sm font-bold text-amber-800">{message}</p>
      <button type="button" onClick={onRetry} className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-bold text-amber-800 shadow-sm">다시 시도</button>
    </Card>
  );
}

export default function PortfolioPage() {
  const { user } = useAuth();
  const client = useQueryClient();
  const [form, setForm] = useState(blankForm);
  const [lastAnalysisKey, setLastAnalysisKey] = useState('');
  const [lastInsights, setLastInsights] = useState(null);

  const crypto = useQuery({ queryKey: ['crypto'], queryFn: getCryptoPrices });
  const stocks = useQuery({ queryKey: ['stocks', 'us'], queryFn: getUsStocks });
  const koreanStocks = useQuery({ queryKey: ['stocks', 'kr'], queryFn: getKoreanStocks });
  const portfolio = useQuery({ queryKey: ['portfolio'], queryFn: () => getPortfolio(token()), enabled: Boolean(user) });

  const assets = useMemo(() => [
    ...(crypto.data || []).map((item) => ({ ...item, itemKey: `crypto:${item.id}`, assetType: 'crypto' })),
    ...(stocks.data || []).map((item) => ({ ...item, itemKey: `stock:${item.id}`, assetType: 'stock' })),
    ...(koreanStocks.data || []).map((item) => ({ ...item, itemKey: `korean-stock:${item.id}`, assetType: 'korean-stock' })),
  ], [crypto.data, koreanStocks.data, stocks.data]);

  const selected = assets.find((item) => item.itemKey === form.itemKey);
  const selectedPrice = parsePrice(selected?.price);
  const holdings = portfolio.data?.holdings || [];
  const rows = holdings.map((holding) => {
    const current = assets.find((item) => item.itemKey === holding.itemKey);
    const currentPrice = parsePrice(current?.price);
    const cost = Number(holding.quantity) * Number(holding.averagePrice);
    const value = Number(holding.quantity) * currentPrice;
    const costKrw = toKrw(cost, holding.assetType);
    const valueKrw = toKrw(value, holding.assetType);
    const profitKrw = valueKrw - costKrw;
    const profitRate = costKrw > 0 ? (profitKrw / costKrw) * 100 : 0;
    return { ...holding, currentPrice, cost, value, costKrw, valueKrw, profitKrw, profitRate, change: current?.change };
  });
  const totalCost = rows.reduce((sum, item) => sum + item.costKrw, 0);
  const totalValue = rows.reduce((sum, item) => sum + item.valueKrw, 0);
  const totalProfit = totalValue - totalCost;
  const totalRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
  const rowsWithAllocation = rows.map((item) => ({ ...item, allocation: totalValue > 0 ? (item.valueKrw / totalValue) * 100 : 0 }));
  const topAsset = rowsWithAllocation.reduce((top, item) => (item.allocation > (top?.allocation || 0) ? item : top), null);
  const diagnosis = rows.length === 0
    ? '아직 등록된 자산이 없습니다.'
    : topAsset?.allocation >= 60
      ? `${topAsset.symbol} 비중이 ${percent(topAsset.allocation)}로 높습니다. 특정 종목 집중도를 확인해보세요.`
      : totalProfit >= 0
        ? `전체 수익률은 ${percent(totalRate)}입니다. 현재 구성은 비교적 분산되어 있습니다.`
        : `전체 수익률은 ${percent(totalRate)}입니다. 평균 매수가와 현재가 차이를 점검해보세요.`;

  const analysisPayload = {
    portfolioSummary: { totalInvestment: totalCost, totalEvaluation: totalValue, totalProfit, totalReturnRate: totalRate, currency: 'KRW', usdKrwRate: USD_TO_KRW_RATE },
    assets: rowsWithAllocation.map((item) => ({
      itemKey: item.itemKey,
      symbol: item.symbol,
      name: item.name,
      assetType: item.assetType,
      market: item.assetType,
      quantity: item.quantity,
      averagePurchasePrice: item.averagePrice,
      currentPrice: item.currentPrice,
      investmentAmount: item.costKrw,
      evaluationAmount: item.valueKrw,
      profit: item.profitKrw,
      returnRate: item.profitRate,
      weight: item.allocation,
    })),
  };
  const analysisKey = rowsWithAllocation.length > 0 ? JSON.stringify(analysisPayload) : 'empty';
  const portfolioAi = useQuery({ queryKey: ['ai', 'portfolio-analysis', analysisKey], queryFn: () => postPortfolioAiAnalysis(token(), analysisPayload), enabled: false, retry: false, staleTime: Infinity, gcTime: Infinity });
  const investmentInsights = useMutation({ mutationFn: () => requestInvestmentInsights(token()), retry: false, onSuccess: (data) => { if (data?.insights) setLastInsights(data.insights); } });
  const save = useMutation({
    mutationFn: () => savePortfolioHolding(token(), { itemKey: selected.itemKey, assetType: selected.assetType, symbol: selected.symbol || selected.name, name: selected.name, quantity: form.quantity, averagePrice: form.averagePrice }),
    onSuccess: () => { setForm(blankForm); client.invalidateQueries({ queryKey: ['portfolio'] }); client.removeQueries({ queryKey: ['ai', 'portfolio-analysis'] }); setLastInsights(null); investmentInsights.reset(); },
  });
  const remove = useMutation({ mutationFn: (itemKey) => deletePortfolioHolding(token(), itemKey), onSuccess: () => { client.invalidateQueries({ queryKey: ['portfolio'] }); client.removeQueries({ queryKey: ['ai', 'portfolio-analysis'] }); setLastInsights(null); investmentInsights.reset(); } });
  const canSave = Boolean(selected) && Number(form.quantity) > 0 && Number(form.averagePrice) >= 0 && !save.isPending;
  const runPortfolioAiAnalysis = async () => { const result = await portfolioAi.refetch(); if (result.data?.analysis) setLastAnalysisKey(analysisKey); };
  const analysisChanged = Boolean(lastAnalysisKey && lastAnalysisKey !== analysisKey && rowsWithAllocation.length > 0);

  if (!user) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Portfolio" title="포트폴리오" description="로그인하면 보유 자산을 관리할 수 있습니다." />
        <StatusCard title="로그인이 필요합니다" description="포트폴리오 데이터는 로그인한 사용자에게만 표시됩니다." action={<Link to="/" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)]">홈에서 로그인하기</Link>} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader eyebrow="Portfolio" title="포트폴리오" description={`${user.name || user.username}님의 실제 보유 자산 기준 요약입니다.`} />
        <a href="#portfolio-form" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white transition hover:bg-[var(--color-primary-hover)]">자산 추가</a>
      </div>

      {portfolio.isLoading ? <LoadingBlocks /> : portfolio.error ? (
        <StatusCard title="포트폴리오 정보를 불러오지 못했습니다" description="잠시 후 다시 시도해주세요." action={<button type="button" onClick={() => portfolio.refetch()} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)]">다시 시도</button>} />
      ) : (
        <div className="space-y-8">
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.65fr)]">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <SummaryCard featured label="총 평가금액" value={krw(totalValue)} description={`현재가 기준 총 평가금액 · 달러 자산은 1달러 ${krw(USD_TO_KRW_RATE)} 기준 환산`} />
                <SummaryCard label="총 투자금액" value={krw(totalCost)} description="평균 매수가 기준 총 투자금액 · 원화 환산" />
                <SummaryCard label="보유 자산" value={`${rows.length}개`} description="등록된 보유 자산" />
                <SummaryCard label="총 수익금" value={krw(totalProfit)} tone={toneClass(totalProfit)} description={totalProfit >= 0 ? '수익 구간' : '손실 구간'} />
                <SummaryCard label="총 수익률" value={percent(totalRate)} tone={toneClass(totalProfit)} description="총 투자금액 대비" />
              </div>
              <Card hover={false} className="p-5"><p className="text-sm font-bold text-[var(--color-text-secondary)]">포트폴리오 진단</p><p className="mt-2 break-words text-base font-extrabold leading-7 text-[var(--color-text-primary)]">{diagnosis}</p></Card>
            </div>
            <AllocationPanel rows={rowsWithAllocation} />
          </section>

          <section aria-live="polite">
            <Card hover={false} className={`${portfolioAi.data?.analysis ? 'hidden' : ''} p-5 sm:p-6`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">AI Portfolio</p><h2 className="mt-1 text-xl font-black text-[var(--color-text-primary)]">AI 포트폴리오 분석</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">현재 계산된 보유 자산 데이터를 바탕으로 구성과 집중 위험을 평가합니다.</p></div>
                <button type="button" onClick={runPortfolioAiAnalysis} disabled={rows.length === 0 || portfolioAi.isFetching} aria-busy={portfolioAi.isFetching} className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto">{portfolioAi.isFetching ? 'AI 분석 중' : portfolioAi.data ? '다시 분석' : 'AI로 포트폴리오 분석'}</button>
              </div>
              {rows.length === 0 && <p className="mt-4 rounded-2xl border border-dashed border-[var(--color-border)] bg-slate-50 p-4 text-sm font-semibold text-[var(--color-text-secondary)]">분석할 보유 자산이 없습니다.</p>}
              {analysisChanged && <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">포트폴리오가 변경되었습니다. 다시 분석해주세요.</p>}
            </Card>
            <div className="mt-4">{portfolioAi.data?.analysis && <AiPortfolioPanel analysis={portfolioAi.data.analysis} cached={portfolioAi.data.cached} onRerun={runPortfolioAiAnalysis} rerunning={portfolioAi.isFetching} />}{portfolioAi.isError && <AiErrorBox error={portfolioAi.error} onRetry={runPortfolioAiAnalysis} />}</div>
          </section>

          <section aria-live="polite">
            <Card hover={false} className={`${lastInsights ? 'hidden' : ''} p-5 sm:p-6`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">AI Investment</p><h2 className="mt-1 text-xl font-black text-[var(--color-text-primary)]">AI 투자 인사이트</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">보유 자산과 관련 뉴스, 시장 데이터를 연결해 확인할 점을 정리합니다.</p></div>
                <button type="button" onClick={() => investmentInsights.mutate()} disabled={rows.length === 0 || investmentInsights.isPending} aria-busy={investmentInsights.isPending} className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto">{investmentInsights.isPending ? 'AI 인사이트 생성 중' : lastInsights ? '다시 보기' : 'AI로 투자 인사이트 보기'}</button>
              </div>
            </Card>
            <div className="mt-4 space-y-4">{lastInsights && <InvestmentInsightsPanel insights={lastInsights} onRerun={() => investmentInsights.mutate()} rerunning={investmentInsights.isPending} />}{investmentInsights.isError && <AiErrorBox error={investmentInsights.error} onRetry={() => investmentInsights.mutate()} />}</div>
          </section>

          <section id="portfolio-form"><HoldingForm assets={assets} form={form} selected={selected} selectedPrice={selectedPrice} canSave={canSave} save={save} reset={() => setForm(blankForm)} setForm={setForm} /></section>

          <section>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)]">보유 자산</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">등록된 자산별 평가금액과 손익을 확인하세요.</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[var(--color-primary)] shadow-[var(--shadow-card)]">{rows.length}개</span></div>
            {rows.length === 0 ? <StatusCard title="아직 등록된 자산이 없습니다" description="보유 중인 주식이나 암호화폐를 추가해 포트폴리오를 구성해보세요." action={<a href="#portfolio-form" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)]">자산 추가</a>} /> : <HoldingsTable rows={rowsWithAllocation} remove={remove} setForm={setForm} />}
          </section>
        </div>
      )}
    </main>
  );
}
