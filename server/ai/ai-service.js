import '../env.js';
import { AiError, AI_MESSAGES } from './ai-errors.js';
import { hashPayload, readAiCache, writeAiCache } from './ai-cache.js';
import { assertAiRateLimit, reserveOpenAiCallBudget } from './ai-rate-limit.js';
import { createNewsSummaryPrompt } from './prompts/news-summary.js';
import { createPortfolioAnalysisPrompt } from './prompts/portfolio-analysis.js';
import { createInvestmentInsightsPrompt } from './prompts/investment-insights.js';
import { newsSummarySchema, validateNewsSummary } from './schemas/news-summary.schema.js';
import { portfolioAnalysisSchema, validatePortfolioAnalysis } from './schemas/portfolio-analysis.schema.js';
import { investmentInsightsSchema, validateInvestmentInsights } from './schemas/investment-insights.schema.js';

const endpoint = `${process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'}/chat/completions`;
const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 20_000);
const maxOutputTokens = Number(process.env.AI_MAX_OUTPUT_TOKENS || 500);
const newsPromptVersion = 'news-v1';
const newsSchemaVersion = 'news-summary-v1';
const portfolioPromptVersion = 'portfolio-v1';
const portfolioSchemaVersion = 'portfolio-analysis-v1';
const investmentPromptVersion = 'investment-insights-v1';
const investmentSchemaVersion = 'investment-insights-v1';
const portfolioDisclaimer = 'AI 분석은 현재 포트폴리오 데이터를 정리한 참고 정보입니다. 투자 자문이나 수익 보장을 의미하지 않으며, 실제 투자 판단은 사용자가 직접 해야 합니다.';
const investmentDisclaimer = '투자 참고 정보이며 투자 권유가 아닙니다.';
const inFlight = new Map();

export function assertAiAvailable() {
  if (process.env.AI_ENABLED !== 'true') {
    throw new AiError('AI_DISABLED', AI_MESSAGES.disabled, 503);
  }
  if (!process.env.OPENAI_API_KEY) {
    throw new AiError('MISSING_API_KEY', AI_MESSAGES.config, 503);
  }
}

function sanitizeNewsPayload(payload = {}) {
  const trim = (value, max) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
  return {
    title: trim(payload.title, 300),
    summary: trim(payload.summary, 2500),
    content: trim(payload.content, 2500),
    description: trim(payload.description, 1500),
    category: trim(payload.category, 80),
    source: trim(payload.source, 120),
    provider: trim(payload.provider, 120),
    url: trim(payload.url, 500),
    relatedAssets: Array.isArray(payload.relatedAssets)
      ? payload.relatedAssets.map((item) => trim(item, 40)).filter(Boolean).slice(0, 12)
      : [],
  };
}

function parseAiContent(content, validate, trace) {
  let parsed;
  const parseEnd = trace?.startStep?.('jsonParsing');
  try {
    parsed = JSON.parse(content);
    parseEnd?.();
  } catch {
    parseEnd?.({ error: 'INVALID_JSON' });
    throw new AiError('INVALID_JSON', AI_MESSAGES.invalidResponse, 502);
  }

  const schemaEnd = trace?.startStep?.('jsonSchemaValidation');
  const valid = validate(parsed);
  schemaEnd?.({ schemaValid: valid });
  if (!valid) throw new AiError('INVALID_AI_RESPONSE', AI_MESSAGES.invalidResponse, 502);
  return parsed;
}

async function callOpenAi({ prompt, schema, schemaName, validate, errorMessage = AI_MESSAGES.failed, userKey = 'anonymous', trace }) {
  assertAiAvailable();
  reserveOpenAiCallBudget(userKey);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  timer.unref?.();
  const requestBody = JSON.stringify({
    model,
    messages: [
      { role: 'system', content: 'Return only valid JSON that matches the provided schema. Do not provide investment recommendations, price forecasts, or trading instructions.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    max_tokens: maxOutputTokens,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: schemaName,
        strict: true,
        schema,
      },
    },
  });
  const openAiEnd = trace?.startStep?.('openAiCall', {
    model,
    maxTokens: maxOutputTokens,
    timeoutMs,
    payloadBytes: Buffer.byteLength(requestBody),
    promptChars: prompt.length,
  });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: requestBody,
    });
    const data = await response.json().catch(() => null);
    const finishReason = data?.choices?.[0]?.finish_reason || null;
    openAiEnd?.({ ok: response.ok, status: response.status, usagePresent: Boolean(data?.usage), finishReason });

    if (!response.ok) {
      throw new AiError(
        response.status === 429 ? 'OPENAI_RATE_LIMIT' : 'OPENAI_ERROR',
        response.status === 429 ? AI_MESSAGES.rateLimit : errorMessage,
        response.status === 429 ? 429 : 502,
      );
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new AiError('EMPTY_RESPONSE', errorMessage, 502);
    return parseAiContent(content, validate, trace);
  } catch (error) {
    if (error instanceof AiError) throw error;
    if (error?.name === 'AbortError') {
      openAiEnd?.({ error: 'TIMEOUT' });
      throw new AiError('TIMEOUT', AI_MESSAGES.timeout, 504);
    }
    throw new AiError('AI_FAILED', errorMessage, 502);
  } finally {
    clearTimeout(timer);
  }
}
async function runCachedOpenAi(cacheKey, loader) {
  const existing = inFlight.get(cacheKey);
  if (existing) return { value: await existing, shared: true };

  const promise = loader();
  inFlight.set(cacheKey, promise);
  try {
    const value = await promise;
    writeAiCache(cacheKey, value);
    return { value, shared: false };
  } finally {
    inFlight.delete(cacheKey);
  }
}

const finite = (value) => Number.isFinite(Number(value));
const round = (value) => Number(Number(value || 0).toFixed(4));
const cleanText = (value, max) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);

function sanitizePortfolioPayload(payload = {}) {
  const summary = payload.portfolioSummary || {};
  const assets = Array.isArray(payload.assets) ? payload.assets : null;
  if (!assets) throw new AiError('INVALID_INPUT', AI_MESSAGES.portfolioFailed, 400);
  if (assets.length === 0) throw new AiError('EMPTY_PORTFOLIO', AI_MESSAGES.emptyPortfolio, 400);
  if (assets.length > 50) throw new AiError('TOO_MANY_ASSETS', AI_MESSAGES.portfolioFailed, 400);

  const cleanNumber = (value) => {
    if (!finite(value)) throw new AiError('INVALID_NUMBER', AI_MESSAGES.portfolioFailed, 400);
    return round(value);
  };
  const allowedTypes = new Set(['crypto', 'stock', 'korean-stock']);

  const cleanAssets = assets.map((asset) => {
    const itemKey = cleanText(asset.itemKey, 120);
    const assetType = cleanText(asset.assetType, 30);
    if (!itemKey) throw new AiError('INVALID_ASSET', AI_MESSAGES.portfolioFailed, 400);
    if (!allowedTypes.has(assetType)) throw new AiError('INVALID_ASSET_TYPE', AI_MESSAGES.portfolioFailed, 400);

    const quantity = cleanNumber(asset.quantity);
    const averagePurchasePrice = cleanNumber(asset.averagePurchasePrice);
    const currentPrice = cleanNumber(asset.currentPrice);
    const investmentAmount = cleanNumber(asset.investmentAmount);
    const evaluationAmount = cleanNumber(asset.evaluationAmount);
    const profit = cleanNumber(asset.profit);
    const returnRate = cleanNumber(asset.returnRate);
    const weight = cleanNumber(asset.weight);

    if (quantity < 0 || averagePurchasePrice < 0 || currentPrice < 0 || investmentAmount < 0 || evaluationAmount < 0 || weight < 0) {
      throw new AiError('INVALID_NEGATIVE_VALUE', AI_MESSAGES.portfolioFailed, 400);
    }

    return {
      itemKey,
      symbol: cleanText(asset.symbol, 40),
      name: cleanText(asset.name, 120),
      assetType,
      market: cleanText(asset.market, 30),
      quantity,
      averagePurchasePrice,
      currentPrice,
      investmentAmount,
      evaluationAmount,
      profit,
      returnRate,
      weight,
    };
  });

  return {
    portfolioSummary: {
      totalInvestment: cleanNumber(summary.totalInvestment),
      totalEvaluation: cleanNumber(summary.totalEvaluation),
      totalProfit: cleanNumber(summary.totalProfit),
      totalReturnRate: cleanNumber(summary.totalReturnRate),
      currency: cleanText(summary.currency || 'USD', 10),
    },
    assets: cleanAssets,
  };
}

function createPortfolioFacts(portfolio) {
  const assets = [...portfolio.assets].sort((a, b) => b.weight - a.weight);
  const largest = assets[0] || null;
  const topPositionsWeight = round(assets.slice(0, 3).reduce((sum, item) => sum + item.weight, 0));
  const assetTypeWeights = Object.values(portfolio.assets.reduce((acc, asset) => {
    acc[asset.assetType] ||= { assetType: asset.assetType, weight: 0, count: 0 };
    acc[asset.assetType].weight += asset.weight;
    acc[asset.assetType].count += 1;
    return acc;
  }, {})).map((entry) => ({ ...entry, weight: round(entry.weight) })).sort((a, b) => b.weight - a.weight);

  return {
    assetsCount: portfolio.assets.length,
    largestPosition: largest ? { name: largest.name, symbol: largest.symbol, weight: largest.weight } : null,
    topPositionsWeight,
    assetTypeWeights,
    positiveContributors: portfolio.assets
      .filter((asset) => asset.profit > 0)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 3)
      .map((asset) => ({ symbol: asset.symbol, name: asset.name, profit: asset.profit, returnRate: asset.returnRate })),
    negativeContributors: portfolio.assets
      .filter((asset) => asset.profit < 0)
      .sort((a, b) => a.profit - b.profit)
      .slice(0, 3)
      .map((asset) => ({ symbol: asset.symbol, name: asset.name, profit: asset.profit, returnRate: asset.returnRate })),
  };
}

function enforcePortfolioFacts(aiResult, facts) {
  const mentionedAssets = new Set([
    ...facts.positiveContributors.map((item) => item.symbol),
    ...facts.negativeContributors.map((item) => item.symbol),
    ...(facts.largestPosition ? [facts.largestPosition.symbol] : []),
  ]);

  const safeList = (items) => items.filter((item) => {
    const upper = item.toUpperCase();
    return !/[A-Z0-9.-]{2,}/.test(upper) || [...mentionedAssets].some((symbol) => upper.includes(symbol.toUpperCase()));
  }).slice(0, 5);

  return {
    ...aiResult,
    composition: {
      ...aiResult.composition,
      largestPosition: facts.largestPosition,
      topPositionsWeight: facts.topPositionsWeight,
      assetTypeWeights: facts.assetTypeWeights,
      assetTypeInsights: safeList(aiResult.composition.assetTypeInsights || []),
    },
    performance: {
      ...aiResult.performance,
      positiveContributors: safeList(aiResult.performance.positiveContributors || []),
      negativeContributors: safeList(aiResult.performance.negativeContributors || []),
    },
    strengths: safeList(aiResult.strengths || []),
    risks: (aiResult.risks || []).slice(0, 5).map((risk) => ({
      title: risk.title,
      description: risk.description,
      severity: ['low', 'medium', 'high'].includes(risk.severity) ? risk.severity : 'medium',
    })),
    checkpoints: safeList(aiResult.checkpoints || []),
    disclaimer: portfolioDisclaimer,
  };
}

function sanitizeInvestmentPayload(payload = {}) {
  const summary = payload.portfolioSummary || {};
  const assets = Array.isArray(payload.assets) ? payload.assets : [];
  const relatedNews = Array.isArray(payload.relatedNews) ? payload.relatedNews : [];
  const market = Array.isArray(payload.market) ? payload.market : [];
  if (assets.length === 0) throw new AiError('EMPTY_PORTFOLIO', AI_MESSAGES.emptyPortfolio, 400);
  if (relatedNews.length === 0 && market.length === 0) throw new AiError('INSUFFICIENT_DATA', AI_MESSAGES.insufficientData, 422);

  const cleanNumber = (value) => round(Number.isFinite(Number(value)) ? value : 0);
  return {
    portfolioSummary: {
      totalEvaluation: cleanNumber(summary.totalEvaluation),
      totalProfit: cleanNumber(summary.totalProfit),
      totalReturnRate: cleanNumber(summary.totalReturnRate),
      assetsCount: cleanNumber(summary.assetsCount),
      largestPositionWeight: cleanNumber(summary.largestPositionWeight),
    },
    assets: assets.slice(0, 10).map((asset) => ({
      itemKey: cleanText(asset.itemKey, 120),
      symbol: cleanText(asset.symbol, 40),
      name: cleanText(asset.name, 120),
      assetType: cleanText(asset.assetType, 30),
      weight: cleanNumber(asset.weight),
      evaluationAmount: cleanNumber(asset.evaluationAmount),
      returnRate: cleanNumber(asset.returnRate),
    })),
    relatedNews: relatedNews.slice(0, 8).map((news) => ({
      id: cleanText(news.id, 80),
      title: cleanText(news.title, 180),
      summary: cleanText(news.summary, 300),
      source: cleanText(news.source || news.provider, 100),
      date: cleanText(news.date || news.time, 80),
      relatedAssets: Array.isArray(news.relatedAssets) ? news.relatedAssets.map((item) => cleanText(item, 40)).filter(Boolean).slice(0, 5) : [],
    })),
    market: market.slice(0, 5).map((item) => ({
      name: cleanText(item.name, 80),
      value: cleanText(item.value, 80),
      change: cleanText(item.change, 40),
    })),
  };
}

function enforceInvestmentFacts(aiResult) {
  const allowed = new Set(['portfolio', 'news', 'market', 'risk']);
  return {
    summary: aiResult.summary,
    highlights: (aiResult.highlights || []).slice(0, 4).map((item) => ({
      title: item.title,
      description: item.description,
      type: allowed.has(item.type) ? item.type : 'portfolio',
    })),
    portfolioObservation: aiResult.portfolioObservation,
    newsObservation: aiResult.newsObservation,
    riskChecks: (aiResult.riskChecks || []).slice(0, 3),
    disclaimer: investmentDisclaimer,
  };
}

export async function summarizeNews(payload, { clientKey = 'anonymous' } = {}) {
  assertAiAvailable();
  const news = sanitizeNewsPayload(payload);
  if (!news.title || !(news.summary || news.content || news.description)) {
    throw new AiError('INVALID_INPUT', AI_MESSAGES.failed, 400);
  }

  const cacheKey = `news-summary:${hashPayload({ promptVersion: newsPromptVersion, schemaVersion: newsSchemaVersion, model, news })}`;
  const cached = readAiCache(cacheKey);
  if (cached) return { result: cached, cached: true };
  assertAiRateLimit(`news-summary:${clientKey}`);

  const { value } = await runCachedOpenAi(cacheKey, () => callOpenAi({
    prompt: createNewsSummaryPrompt(news),
    schema: newsSummarySchema,
    schemaName: 'money_platform_news_summary',
    validate: validateNewsSummary,
    userKey: clientKey,
  }));
  return { result: value, cached: false };
}

export async function analyzePortfolio(payload, { clientKey = 'anonymous', ownedItemKeys = [] } = {}) {
  assertAiAvailable();
  const portfolio = sanitizePortfolioPayload(payload);
  const owned = new Set(ownedItemKeys);
  if (portfolio.assets.some((asset) => !owned.has(asset.itemKey))) {
    throw new AiError('FORBIDDEN_ASSET', AI_MESSAGES.portfolioFailed, 403);
  }

  const facts = createPortfolioFacts(portfolio);
  const cachePayload = { promptVersion: portfolioPromptVersion, schemaVersion: portfolioSchemaVersion, model, portfolio, facts };
  const cacheKey = `portfolio-analysis:${hashPayload(cachePayload)}`;
  const cached = readAiCache(cacheKey);
  if (cached) return { analysis: cached, cached: true };
  assertAiRateLimit(clientKey);

  const { value } = await runCachedOpenAi(cacheKey, async () => {
    const aiResult = await callOpenAi({
      prompt: createPortfolioAnalysisPrompt({ summary: portfolio.portfolioSummary, facts, assets: portfolio.assets }),
      schema: portfolioAnalysisSchema,
      schemaName: 'money_platform_portfolio_analysis',
      validate: validatePortfolioAnalysis,
      errorMessage: AI_MESSAGES.portfolioFailed,
      userKey: clientKey,
    });
    return {
      generatedAt: new Date().toISOString(),
      basis: {
        ...portfolio.portfolioSummary,
        assetsCount: facts.assetsCount,
      },
      result: enforcePortfolioFacts(aiResult, facts),
    };
  });
  return { analysis: value, cached: false };
}

export async function createInvestmentInsights(payload, { clientKey = 'anonymous', userHash = 'anonymous', trace } = {}) {
  assertAiAvailable();
  const data = sanitizeInvestmentPayload(payload);
  const cachePayload = { feature: 'investment-insights', userHash, promptVersion: investmentPromptVersion, schemaVersion: investmentSchemaVersion, model, data };
  const cacheKey = `investment-insights:${hashPayload(cachePayload)}`;
  const cached = readAiCache(cacheKey);
  if (cached) return { insights: cached, cached: true };
  assertAiRateLimit(`investment-insights:${clientKey}`);

  const { value } = await runCachedOpenAi(cacheKey, async () => {
    const promptEnd = trace?.startStep?.('promptGeneration');
    const prompt = createInvestmentInsightsPrompt(data);
    promptEnd?.({ promptChars: prompt.length });
    const aiResult = await callOpenAi({
      prompt,
      schema: investmentInsightsSchema,
      schemaName: 'money_platform_investment_insights',
      validate: validateInvestmentInsights,
      errorMessage: AI_MESSAGES.investmentFailed,
      userKey: clientKey,
      trace,
    });
    return {
      generatedAt: new Date().toISOString(),
      basis: data.portfolioSummary,
      result: enforceInvestmentFacts(aiResult),
    };
  });
  return { insights: value, cached: false };
}
