import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import AssetIcon from '../components/ui/AssetIcon';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import PriceChangeBadge from '../components/ui/PriceChangeBadge';
import { useAuth } from '../context/AuthContext';
import { deletePortfolioHolding, getCryptoPrices, getKoreanStocks, getPortfolio, getUsStocks, postPortfolioAiAnalysis, requestInvestmentInsights, savePortfolioHolding } from '../services/api';

const t = {
  title: '포트폴리오',
  description: '보유 자산과 투자 성과를 한눈에 확인하세요.',
  login: '로그인 후 보유 자산을 관리할 수 있습니다.',
  go: '메인에서 로그인하기',
  empty: '아직 등록된 자산이 없습니다.',
  emptyDescription: '보유 중인 주식이나 암호화폐를 추가해 포트폴리오를 구성해보세요.',
  asset: '자산',
  quantity: '수량',
  average: '평균 매수가',
  save: '저장',
  saving: '저장 중...',
  edit: '수정',
  remove: '삭제',
  confirmRemove: '이 보유 자산을 포트폴리오에서 삭제할까요?',
  reset: '입력 초기화',
  addTitle: '자산 추가 및 수정',
  addDescription: '보유 수량과 평균 매수가를 입력하면 기존 계산 방식으로 평가금액에 반영됩니다.',
  count: '보유 자산',
  cost: '총 투자금액',
  value: '총 평가금액',
  profit: '총 수익금',
  rate: '총 수익률',
  current: '현재가',
  valuation: '평가금액',
  allocation: '비중',
  diagnosis: '포트폴리오 진단',
  selectedPrice: '선택 자산 현재가',
  useCurrent: '현재가 입력',
  holdings: '보유 자산',
  holdingsDescription: '등록된 자산별 평가금액과 손익을 확인하세요.',
  composition: '자산 구성',
  compositionDescription: '현재 평가금액 기준 비중입니다.',
  aiTitle: 'AI 포트폴리오 분석',
  aiDescription: '현재 계산된 보유 자산 데이터를 바탕으로 구성과 집중 위험을 평가합니다.',
  aiRun: 'AI로 포트폴리오 분석',
  aiRunning: 'AI 분석 중...',
  aiRerun: '다시 분석',
  aiEmpty: '분석할 보유 자산이 없습니다.',
  aiEmptyDescription: '자산을 추가하면 AI가 포트폴리오 구성을 분석해드립니다.',
  aiFailed: 'AI 포트폴리오 분석을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.',
  aiChanged: '포트폴리오가 변경되었습니다. 다시 분석해주세요.',
  overall: '전체 요약',
  performance: '현재 수익 현황',
  strengths: '긍정적인 부분',
  risks: '주의할 위험 요소',
  checkpoints: '확인할 사항',
  largestPosition: '가장 비중이 높은 자산',
  topWeight: '상위 3개 자산 비중',
  generatedAt: '분석 생성 시각',
  retry: '다시 시도',
  insightTitle: 'AI 투자 인사이트',
  insightDescription: '보유 자산과 관련 뉴스, 시장 데이터를 연결해 확인할 점을 정리합니다.',
  insightRun: 'AI로 투자 인사이트 보기',
  insightRunning: 'AI 인사이트 생성 중...',
  insightRerun: '다시 보기',
  insightEmpty: '인사이트를 만들 보유 자산이 없습니다.',
  insightFailed: 'AI 투자 인사이트를 완료하지 못했습니다.',
  insightDisabled: 'AI 기능이 현재 비활성화되어 있습니다.',
  insightLimit: '오늘 사용할 수 있는 AI 분석 횟수를 모두 사용했습니다.',
};

const token = () => localStorage.getItem('mp_token') || '';
const price = (value) => Number(String(value).replace(/[^0-9.]/g, '')) || 0;
const money = (value, assetType = 'stock') => assetType === 'korean-stock' ? `₩${Number(value || 0).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}` : `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const USD_TO_KRW_RATE = 1380;
const krwMoney = (value) => `₩${Number(value || 0).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}`;
const toKrw = (value, assetType) => Number(value || 0) * (assetType === 'korean-stock' ? 1 : USD_TO_KRW_RATE);
const percent = (value) => `${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
const blankForm = { itemKey: '', quantity: '', averagePrice: '' };
const assetTypeLabel = {
  crypto: '암호화폐',
  stock: '미국 주식',
  'korean-stock': '한국 주식',
};
const allocationColors = ['bg-blue-500', 'bg-sky-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-slate-500'];

function toneClass(value) {
  if (value > 0) return 'text-[var(--color-positive)]';
  if (value < 0) return 'text-[var(--color-negative)]';
  return 'text-slate-500';
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

function PortfolioSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-[var(--radius-card)] bg-slate-200" />)}
      </div>
      <div className="h-80 animate-pulse rounded-[var(--radius-card)] bg-slate-200" />
    </div>
  );
}

function AiPortfolioSkeleton() {
  return (
    <Card hover={false} className="p-5 sm:p-6" aria-hidden="true">
      <div className="animate-pulse space-y-5">
        <div className="h-5 w-40 rounded bg-slate-100" />
        <div className="h-4 w-full rounded bg-slate-100" />
        <div className="h-4 w-5/6 rounded bg-slate-100" />
        <div className="grid gap-3 md:grid-cols-3">
          <div className="h-24 rounded-2xl bg-slate-100" />
          <div className="h-24 rounded-2xl bg-slate-100" />
          <div className="h-24 rounded-2xl bg-slate-100" />
        </div>
      </div>
    </Card>
  );
}

function SeverityBadge({ severity }) {
  const label = severity === 'high' ? '높은 주의' : severity === 'medium' ? '주의' : '낮은 주의';
  const tone = severity === 'high'
    ? 'border-red-200 bg-red-50 text-red-600'
    : severity === 'medium'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-slate-200 bg-slate-50 text-slate-600';

  return <span className={`rounded-full border px-2.5 py-1 text-xs font-extrabold ${tone}`}>{label}</span>;
}

function AiSectionList({ title, items }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-slate-50 p-4">
      <h4 className="text-sm font-extrabold text-[var(--color-text-primary)]">{title}</h4>
      {items?.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-text-secondary)]">
          {items.map((item) => <li key={item}>- {item}</li>)}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-[var(--color-text-tertiary)]">-</p>
      )}
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
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">AI Insight</p>
          <h2 className="mt-1 text-xl font-black text-[var(--color-text-primary)]">{t.aiTitle}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">{result.overallSummary}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {cached && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-[var(--color-text-secondary)]">캐시 사용</span>}
          <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">{t.generatedAt}: {new Date(generatedAt).toLocaleString()}</span>
          {onRerun && (
            <button type="button" onClick={onRerun} disabled={rerunning} className="inline-flex min-h-9 items-center justify-center rounded-full bg-[var(--color-primary)] px-3 text-xs font-bold text-white transition hover:bg-[var(--color-primary-hover)] disabled:bg-slate-300">
              {rerunning ? t.aiRunning : t.aiRerun}
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCell label={t.value} value={money(basis.totalEvaluation)} strong />
        <InfoCell label={t.profit} value={money(basis.totalProfit)} tone={toneClass(basis.totalProfit)} strong />
        <InfoCell label={t.rate} value={percent(basis.totalReturnRate)} tone={toneClass(basis.totalProfit)} strong />
        <InfoCell label={t.topWeight} value={percent(result.composition?.topPositionsWeight)} strong />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
            <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">{t.composition}</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{result.composition?.summary}</p>
            {largest && (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold text-[var(--color-text-tertiary)]">{t.largestPosition}</p>
                <p className="mt-1 break-words text-lg font-black text-[var(--color-text-primary)]">{largest.symbol} · {largest.name} · {percent(largest.weight)}</p>
              </div>
            )}
            {result.composition?.assetTypeWeights?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {result.composition.assetTypeWeights.map((item) => (
                  <span key={item.assetType} className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-extrabold text-[var(--color-primary)]">
                    {assetTypeLabel[item.assetType] || item.assetType} {percent(item.weight)}
                  </span>
                ))}
              </div>
            )}
          </div>
          <AiSectionList title="자산 유형별 분석" items={result.composition?.assetTypeInsights} />
          <AiSectionList title={t.performance} items={[result.performance?.summary, ...(result.performance?.positiveContributors || []), ...(result.performance?.negativeContributors || [])].filter(Boolean)} />
        </div>

        <div className="space-y-4">
          <AiSectionList title={t.strengths} items={result.strengths} />
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
            <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">{t.risks}</h3>
            {result.risks?.length > 0 ? (
              <div className="mt-3 space-y-3">
                {result.risks.map((risk) => (
                  <div key={`${risk.title}-${risk.severity}`} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-extrabold text-[var(--color-text-primary)]">{risk.title}</h4>
                      <SeverityBadge severity={risk.severity} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{risk.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[var(--color-text-tertiary)]">-</p>
            )}
          </div>
          <AiSectionList title={t.checkpoints} items={result.checkpoints} />
        </div>
      </div>

      <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
        {result.disclaimer}
      </p>
    </Card>
  );
}

function AiPortfolioError({ onRetry }) {
  return (
    <Card hover={false} className="p-5 sm:p-6" role="alert">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-[var(--color-text-secondary)]">{t.aiFailed}</p>
        <button type="button" onClick={onRetry} className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] px-4 text-sm font-bold text-[var(--color-primary)] hover:bg-blue-100">
          {t.retry}
        </button>
      </div>
    </Card>
  );
}


function InvestmentInsightsPanel({ insights, onRerun, rerunning }) {
  if (!insights?.result) return null;
  const { basis, generatedAt, result } = insights;
  const typeLabel = { portfolio: '포트폴리오', news: '뉴스', market: '시장', risk: '위험' };

  return (
    <Card hover={false} className="p-5 sm:p-6">
      <div className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">AI Insight</p>
          <h2 className="mt-1 text-xl font-black text-[var(--color-text-primary)]">{t.insightTitle}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">{result.summary}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">{t.generatedAt}: {new Date(generatedAt).toLocaleString()}</span>
          {onRerun && (
            <button type="button" onClick={onRerun} disabled={rerunning} className="inline-flex min-h-9 items-center justify-center rounded-full bg-[var(--color-primary)] px-3 text-xs font-bold text-white transition hover:bg-[var(--color-primary-hover)] disabled:bg-slate-300">
              {rerunning ? t.insightRunning : t.insightRerun}
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <InfoCell label={t.value} value={money(basis.totalEvaluation)} strong />
        <InfoCell label={t.rate} value={percent(basis.totalReturnRate)} tone={toneClass(basis.totalProfit)} strong />
        <InfoCell label={t.largestPosition} value={percent(basis.largestPositionWeight)} strong />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {result.highlights.map((item) => (
          <div key={`${item.type}-${item.title}`} className="rounded-2xl border border-[var(--color-border)] bg-slate-50 p-4">
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-[var(--color-primary)]">{typeLabel[item.type] || item.type}</span>
            <h3 className="mt-3 text-base font-extrabold text-[var(--color-text-primary)]">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <AiSectionList title="포트폴리오 관찰" items={[result.portfolioObservation].filter(Boolean)} />
        <AiSectionList title="뉴스 관찰" items={[result.newsObservation].filter(Boolean)} />
      </div>
      <AiSectionList title="확인할 위험 요소" items={result.riskChecks} />

      <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
        {result.disclaimer}
      </p>
    </Card>
  );
}

function InvestmentInsightsError({ error, onRetry, hasPrevious }) {
  const message = error?.code === 'AI_DISABLED' || error?.code === 'MISSING_API_KEY'
    ? t.insightDisabled
    : error?.code === 'AI_DAILY_LIMIT_REACHED'
      ? t.insightLimit
      : error?.code === 'EMPTY_PORTFOLIO'
        ? t.insightEmpty
        : error?.message || t.insightFailed;

  return (
    <Card hover={false} className="p-5 sm:p-6" role="alert">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[var(--color-text-secondary)]">{message}</p>
          {hasPrevious && <p className="mt-1 text-xs font-semibold text-[var(--color-text-tertiary)]">이전 인사이트는 아래에서 계속 확인할 수 있습니다.</p>}
        </div>
        <button type="button" onClick={onRetry} className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] px-4 text-sm font-bold text-[var(--color-primary)] hover:bg-blue-100">
          {t.retry}
        </button>
      </div>
    </Card>
  );
}

function AllocationPanel({ rows }) {
  if (rows.length === 0) return null;

  return (
    <Card hover={false} className="h-full p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-extrabold text-[var(--color-text-primary)]">{t.composition}</h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t.compositionDescription}</p>
      </div>
      <div className="mt-6 space-y-4">
        {rows.map((item, index) => (
          <div key={item.itemKey}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-extrabold text-[var(--color-text-primary)]">{item.symbol}</p>
                <p className="truncate text-xs text-[var(--color-text-tertiary)]">{item.name}</p>
              </div>
              <span className="shrink-0 font-bold text-[var(--color-text-secondary)]">{percent(item.allocation)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${allocationColors[index % allocationColors.length]}`} style={{ width: `${Math.min(100, Math.max(0, item.allocation))}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function HoldingForm({ assets, form, selected, selectedPrice, canSave, save, reset, setForm }) {
  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  return (
    <Card as="form" hover={false} onSubmit={(event) => { event.preventDefault(); if (canSave) save.mutate(); }} className="p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-[var(--color-text-primary)]">{t.addTitle}</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{t.addDescription}</p>
        </div>
        {form.itemKey && <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">{t.edit}</span>}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(160px,1fr)_minmax(180px,1fr)]">
        <label className="text-sm font-bold text-[var(--color-text-primary)]">
          {t.asset}
          <select value={form.itemKey} onChange={update('itemKey')} className="mt-2 h-11 w-full rounded-2xl border border-[var(--color-border)] bg-white px-3 text-sm font-semibold text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-blue-100">
            <option value="">선택</option>
            {assets.map((item) => <option key={item.itemKey} value={item.itemKey}>{item.symbol || item.name} - {item.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-bold text-[var(--color-text-primary)]">
          {t.quantity}
          <input value={form.quantity} onChange={update('quantity')} min="0" step="any" type="number" className="mt-2 h-11 w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-blue-100" />
        </label>
        <label className="text-sm font-bold text-[var(--color-text-primary)]">
          {t.average}
          <input value={form.averagePrice} onChange={update('averagePrice')} min="0" step="any" type="number" className="mt-2 h-11 w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-blue-100" />
        </label>
      </div>
      {selected && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--color-text-secondary)]">{t.selectedPrice}: <b className="text-[var(--color-text-primary)]">{money(selectedPrice, selected.assetType)}</b></p>
          <button type="button" onClick={() => setForm((prev) => ({ ...prev, averagePrice: String(selectedPrice) }))} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] px-4 text-sm font-bold text-[var(--color-primary)] hover:bg-blue-100">{t.useCurrent}</button>
        </div>
      )}
      {save.error && <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{save.error.message}</p>}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={reset} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[var(--color-border)] px-5 text-sm font-bold text-[var(--color-text-secondary)] hover:bg-slate-50">{t.reset}</button>
        <button type="submit" disabled={!canSave} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white transition hover:bg-[var(--color-primary-hover)] disabled:bg-slate-300">{save.isPending ? t.saving : t.save}</button>
      </div>
    </Card>
  );
}

function HoldingMobileCard({ item, onEdit, onRemove, removing }) {
  return (
    <Card hover={false} className="p-5 md:hidden">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <AssetIcon label={item.name} symbol={item.symbol} />
          <div className="min-w-0">
            <h3 className="truncate text-base font-extrabold text-[var(--color-text-primary)]">{item.symbol}</h3>
            <p className="truncate text-sm text-[var(--color-text-secondary)]">{item.name}</p>
            <p className="mt-1 text-xs font-bold text-[var(--color-primary)]">{assetTypeLabel[item.assetType] || item.assetType}</p>
          </div>
        </div>
        <PriceChangeBadge change={percent(item.profitRate)} isPositive={item.profit >= 0} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <InfoCell label={t.valuation} value={money(item.value, item.assetType)} strong />
        <InfoCell label={t.profit} value={money(item.profit, item.assetType)} tone={toneClass(item.profit)} strong />
        <InfoCell label={t.quantity} value={item.quantity} />
        <InfoCell label={t.average} value={money(item.averagePrice, item.assetType)} />
        <InfoCell label={t.current} value={money(item.currentPrice, item.assetType)} />
        <InfoCell label={t.allocation} value={percent(item.allocation)} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <button type="button" onClick={onEdit} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--color-border)] px-3 text-sm font-bold text-[var(--color-text-secondary)] hover:bg-slate-50">{t.edit}</button>
        <button type="button" disabled={removing} onClick={onRemove} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 px-3 text-sm font-bold text-red-500 hover:bg-red-50 disabled:text-slate-300">{t.remove}</button>
      </div>
    </Card>
  );
}

function InfoCell({ label, value, tone = 'text-[var(--color-text-primary)]', strong = false }) {
  return (
    <div className="min-w-0 rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-bold text-[var(--color-text-tertiary)]">{label}</p>
      <p className={`mt-1 break-words ${strong ? 'text-base font-black' : 'text-sm font-bold'} ${tone}`}>{value}</p>
    </div>
  );
}

function HoldingsTable({ rows, remove, setForm }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)] md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="border-b border-[var(--color-border)] bg-slate-50 text-left text-xs font-extrabold text-[var(--color-text-secondary)]">
              <tr>
                <th className="px-4 py-3">{t.asset}</th>
                <th className="px-4 py-3 text-right">{t.quantity}</th>
                <th className="px-4 py-3 text-right">{t.average}</th>
                <th className="px-4 py-3 text-right">{t.current}</th>
                <th className="px-4 py-3 text-right">{t.valuation}</th>
                <th className="px-4 py-3 text-right">{t.allocation}</th>
                <th className="px-4 py-3 text-right">{t.profit}</th>
                <th className="px-4 py-3 text-right">{t.rate}</th>
                <th className="px-4 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {rows.map((item) => (
                <tr key={item.itemKey} className="transition hover:bg-slate-50/80">
                  <td className="px-4 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <AssetIcon label={item.name} symbol={item.symbol} />
                      <div className="min-w-0">
                        <b className="block truncate text-[var(--color-text-primary)]">{item.symbol}</b>
                        <p className="truncate text-xs text-[var(--color-text-secondary)]">{item.name}</p>
                        <p className="mt-1 text-xs font-bold text-[var(--color-primary)]">{assetTypeLabel[item.assetType] || item.assetType}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-semibold">{item.quantity}</td>
                  <td className="px-4 py-4 text-right">{money(item.averagePrice, item.assetType)}</td>
                  <td className="px-4 py-4 text-right">{money(item.currentPrice, item.assetType)}</td>
                  <td className="px-4 py-4 text-right font-extrabold">{money(item.value, item.assetType)}</td>
                  <td className="px-4 py-4 text-right font-semibold">{percent(item.allocation)}</td>
                  <td className={`px-4 py-4 text-right font-extrabold ${toneClass(item.profit)}`}>{money(item.profit, item.assetType)}</td>
                  <td className="px-4 py-4 text-right"><PriceChangeBadge change={percent(item.profitRate)} isPositive={item.profit >= 0} /></td>
                  <td className="px-4 py-4 text-right">
                    <button type="button" onClick={() => setForm({ itemKey: item.itemKey, quantity: String(item.quantity), averagePrice: String(item.averagePrice) })} className="mr-3 font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">{t.edit}</button>
                    <button type="button" disabled={remove.isPending} onClick={() => { if (window.confirm(t.confirmRemove)) remove.mutate(item.itemKey); }} className="font-bold text-red-500 hover:text-red-600 disabled:text-slate-300">{t.remove}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid gap-4 md:hidden">
        {rows.map((item) => (
          <HoldingMobileCard
            key={item.itemKey}
            item={item}
            removing={remove.isPending}
            onEdit={() => setForm({ itemKey: item.itemKey, quantity: String(item.quantity), averagePrice: String(item.averagePrice) })}
            onRemove={() => { if (window.confirm(t.confirmRemove)) remove.mutate(item.itemKey); }}
          />
        ))}
      </div>
    </>
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
  const selectedPrice = price(selected?.price);
  const holdings = portfolio.data?.holdings || [];
  const rows = holdings.map((holding) => {
    const current = assets.find((item) => item.itemKey === holding.itemKey);
    const currentPrice = price(current?.price);
    const cost = holding.quantity * holding.averagePrice;
    const value = holding.quantity * currentPrice;
    const profit = value - cost;
    const profitRate = cost > 0 ? (profit / cost) * 100 : 0;
    const costKrw = toKrw(cost, holding.assetType);
    const valueKrw = toKrw(value, holding.assetType);
    const profitKrw = valueKrw - costKrw;
    return { ...holding, currentPrice, cost, value, profit, profitRate, costKrw, valueKrw, profitKrw, change: current?.change };
  });
  const totalCost = rows.reduce((sum, item) => sum + item.costKrw, 0);
  const totalValue = rows.reduce((sum, item) => sum + item.valueKrw, 0);
  const rowsWithAllocation = rows.map((item) => ({ ...item, allocation: totalValue > 0 ? (item.valueKrw / totalValue) * 100 : 0 }));
  const totalProfit = totalValue - totalCost;
  const totalRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
  const topAsset = rowsWithAllocation.reduce((top, item) => (item.allocation > (top?.allocation || 0) ? item : top), null);
  const diagnosis = rows.length === 0
    ? t.empty
    : topAsset?.allocation >= 60
      ? `${topAsset.symbol} 비중이 ${percent(topAsset.allocation)}로 높습니다. 한 종목 집중도를 확인해보세요.`
      : totalProfit >= 0
        ? `전체 수익률은 ${percent(totalRate)}입니다. 현재 구성은 비교적 분산되어 있습니다.`
        : `전체 수익률은 ${percent(totalRate)}입니다. 평균 매수가와 현재가 차이를 점검해보세요.`;
  const analysisPayload = {
    portfolioSummary: {
      totalInvestment: totalCost,
      totalEvaluation: totalValue,
      totalProfit,
      totalReturnRate: totalRate,
      currency: 'KRW',
      usdKrwRate: USD_TO_KRW_RATE,
    },
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
  const portfolioAi = useQuery({
    queryKey: ['ai', 'portfolio-analysis', analysisKey],
    queryFn: () => postPortfolioAiAnalysis(token(), analysisPayload),
    enabled: false,
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const analysisChanged = Boolean(lastAnalysisKey && lastAnalysisKey !== analysisKey && rowsWithAllocation.length > 0);
  const investmentInsights = useMutation({
    mutationFn: () => requestInvestmentInsights(token()),
    retry: false,
    onSuccess: (data) => { if (data?.insights) setLastInsights(data.insights); },
  });
  const runInvestmentInsights = () => { if (!investmentInsights.isPending && rows.length > 0) investmentInsights.mutate(); };
  const hasPortfolioAnalysis = Boolean(portfolioAi.data?.analysis);
  const hasInvestmentInsights = Boolean(lastInsights);
  const runPortfolioAiAnalysis = async () => {
    const result = await portfolioAi.refetch();
    if (result.data?.analysis) setLastAnalysisKey(analysisKey);
  };

  const refresh = () => client.invalidateQueries({ queryKey: ['portfolio'] });
  const clearPortfolioAi = () => {
    client.removeQueries({ queryKey: ['ai', 'portfolio-analysis'] });
    setLastInsights(null);
    investmentInsights.reset();
  };
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
    onSuccess: () => { reset(); refresh(); clearPortfolioAi(); },
  });
  const remove = useMutation({ mutationFn: (itemKey) => deletePortfolioHolding(token(), itemKey), onSuccess: () => { refresh(); clearPortfolioAi(); } });
  const canSave = Boolean(selected) && Number(form.quantity) > 0 && Number(form.averagePrice) >= 0 && !save.isPending;

  if (!user) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Portfolio" title={t.title} description={t.login} />
        <StatusCard
          title={t.login}
          description="포트폴리오 데이터는 로그인한 사용자에게만 표시됩니다."
          action={<Link to="/" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)]">{t.go}</Link>}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader eyebrow="Portfolio" title={t.title} description={`${user.name || user.username}님의 실제 보유 자산 기준 요약입니다.`} />
        <a href="#portfolio-form" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white transition hover:bg-[var(--color-primary-hover)]">
          자산 추가
        </a>
      </div>

      {portfolio.isLoading ? (
        <PortfolioSkeleton />
      ) : portfolio.error ? (
        <StatusCard title="포트폴리오 정보를 불러오지 못했습니다." description="잠시 후 다시 시도해주세요." action={<button type="button" onClick={() => portfolio.refetch()} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)]">{t.retry}</button>} />
      ) : (
        <div className="space-y-8">
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.65fr)]">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <SummaryCard featured label={t.value} value={krwMoney(totalValue)} description={`현재가 기준 총 평가금액 · 달러 자산은 1달러 ${krwMoney(USD_TO_KRW_RATE)} 기준 환산`} />
                <SummaryCard label={t.cost} value={krwMoney(totalCost)} description="평균 매수가 기준 총 투자금액 · 원화 환산" />
                <SummaryCard label={t.count} value={`${rows.length}개`} description="등록된 보유 자산" />
                <SummaryCard label={t.profit} value={krwMoney(totalProfit)} tone={toneClass(totalProfit)} description={totalProfit >= 0 ? '수익 구간' : '손실 구간'} />
                <SummaryCard label={t.rate} value={percent(totalRate)} tone={toneClass(totalProfit)} description="총 투자금액 대비" />
              </div>
              <Card hover={false} className="p-5">
                <p className="text-sm font-bold text-[var(--color-text-secondary)]">{t.diagnosis}</p>
                <p className="mt-2 break-words text-base font-extrabold leading-7 text-[var(--color-text-primary)]">{diagnosis}</p>
              </Card>
            </div>
            <AllocationPanel rows={rowsWithAllocation} />
          </section>

          <section aria-live="polite">
            <Card hover={false} className={`${hasPortfolioAnalysis ? 'hidden' : ''} p-5 sm:p-6`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">AI Portfolio</p>
                  <h2 className="mt-1 text-xl font-black text-[var(--color-text-primary)]">{t.aiTitle}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
                    {rows.length === 0 ? t.aiEmptyDescription : t.aiDescription}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={runPortfolioAiAnalysis}
                  disabled={rows.length === 0 || portfolioAi.isFetching}
                  aria-busy={portfolioAi.isFetching}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
                >
                  {portfolioAi.isFetching ? t.aiRunning : portfolioAi.data ? t.aiRerun : t.aiRun}
                </button>
              </div>
              {rows.length === 0 && (
                <p className="mt-4 rounded-2xl border border-dashed border-[var(--color-border)] bg-slate-50 p-4 text-sm font-semibold text-[var(--color-text-secondary)]">
                  {t.aiEmpty}
                </p>
              )}
              {analysisChanged && (
                <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                  {t.aiChanged}
                </p>
              )}
            </Card>

            <div className="mt-4">
              {portfolioAi.isFetching && !hasPortfolioAnalysis && <AiPortfolioSkeleton />}
              {portfolioAi.data?.analysis && <AiPortfolioPanel analysis={portfolioAi.data.analysis} cached={portfolioAi.data.cached} onRerun={runPortfolioAiAnalysis} rerunning={portfolioAi.isFetching} />}
              {portfolioAi.isError && <AiPortfolioError onRetry={runPortfolioAiAnalysis} />}
            </div>
          </section>


          <section aria-live="polite">
            <Card hover={false} className={`${hasInvestmentInsights ? 'hidden' : ''} p-5 sm:p-6`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">AI Investment</p>
                  <h2 className="mt-1 text-xl font-black text-[var(--color-text-primary)]">{t.insightTitle}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
                    {rows.length === 0 ? t.insightEmpty : t.insightDescription}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={runInvestmentInsights}
                  disabled={rows.length === 0 || investmentInsights.isPending}
                  aria-busy={investmentInsights.isPending}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
                >
                  {investmentInsights.isPending ? t.insightRunning : lastInsights ? t.insightRerun : t.insightRun}
                </button>
              </div>
            </Card>

            <div className="mt-4 space-y-4">
              {investmentInsights.isPending && !hasInvestmentInsights && <AiPortfolioSkeleton />}
              {lastInsights && <InvestmentInsightsPanel insights={lastInsights} onRerun={runInvestmentInsights} rerunning={investmentInsights.isPending} />}
              {investmentInsights.isError && <InvestmentInsightsError error={investmentInsights.error} onRetry={runInvestmentInsights} hasPrevious={Boolean(lastInsights)} />}
            </div>
          </section>

          <section id="portfolio-form">
            <HoldingForm assets={assets} form={form} selected={selected} selectedPrice={selectedPrice} canSave={canSave} save={save} reset={reset} setForm={setForm} />
          </section>

          <section>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)]">{t.holdings}</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t.holdingsDescription}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[var(--color-primary)] shadow-[var(--shadow-card)]">{rows.length}개</span>
            </div>
            {rows.length === 0 ? (
              <StatusCard
                title={t.empty}
                description={t.emptyDescription}
                action={<a href="#portfolio-form" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)]">자산 추가</a>}
              />
            ) : (
              <HoldingsTable rows={rowsWithAllocation} remove={remove} setForm={setForm} />
            )}
          </section>
        </div>
      )}
    </main>
  );
}













