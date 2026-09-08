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
const newsPromptVersion = 'news-v3';
const newsSchemaVersion = 'news-summary-v1';
const portfolioPromptVersion = 'portfolio-v3';
const portfolioSchemaVersion = 'portfolio-analysis-v1';
const investmentPromptVersion = 'investment-insights-v2';
const investmentSchemaVersion = 'investment-insights-v1';
const portfolioDisclaimer = '\uC774 \uBD84\uC11D\uC740 \uD604\uC7AC \uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uB370\uC774\uD130\uB97C \uBC14\uD0D5\uC73C\uB85C \uD55C \uCC38\uACE0 \uC815\uBCF4\uC785\uB2C8\uB2E4. \uD22C\uC790 \uAD8C\uC720\uB098 \uC218\uC775 \uBCF4\uC7A5\uC774 \uC544\uB2C8\uBA70, \uCD5C\uC885 \uD310\uB2E8\uC740 \uC0AC\uC6A9\uC790\uAC00 \uC9C1\uC811 \uD574\uC57C \uD569\uB2C8\uB2E4.';
const investmentDisclaimer = '\uD22C\uC790 \uCC38\uACE0 \uC815\uBCF4\uC774\uBA70 \uD22C\uC790 \uAD8C\uC720\uAC00 \uC544\uB2D9\uB2C8\uB2E4.';
const inFlight = new Map();

export function assertAiAvailable() {
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

function extractJsonObject(content) {
  const text = String(content || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
  if (text.startsWith('{') && text.endsWith('}')) return text;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  return start >= 0 && end > start ? text.slice(start, end + 1) : text;
}

function parseAiContent(content, validate, trace) {
  let parsed;
  const parseEnd = trace?.startStep?.('jsonParsing');
  try {
    parsed = JSON.parse(extractJsonObject(content));
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
  let releaseBudget = reserveOpenAiCallBudget(userKey);

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
    response_format: { type: 'json_object' },
  });
  void schema;
  void schemaName;
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
      console.error(JSON.stringify({
        event: 'openai_error',
        status: response.status,
        type: data?.error?.type || null,
        code: data?.error?.code || null,
        finishReason,
      }));
      throw new AiError(
        response.status === 429 ? 'OPENAI_RATE_LIMIT' : 'OPENAI_ERROR',
        response.status === 429 ? AI_MESSAGES.rateLimit : errorMessage,
        response.status === 429 ? 429 : 502,
      );
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new AiError('EMPTY_RESPONSE', errorMessage, 502);
    const parsed = parseAiContent(content, validate, trace);
    releaseBudget = null;
    return parsed;
  } catch (error) {
    releaseBudget?.();
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
  const topPositions = assets.slice(0, 3).map((asset) => ({
    name: asset.name,
    symbol: asset.symbol,
    assetType: asset.assetType,
    evaluationAmount: asset.evaluationAmount,
    weight: asset.weight,
    profit: asset.profit,
    returnRate: asset.returnRate,
  }));
  const topPositionsWeight = round(topPositions.reduce((sum, item) => sum + item.weight, 0));
  const assetTypeWeights = Object.values(portfolio.assets.reduce((acc, asset) => {
    acc[asset.assetType] ||= { assetType: asset.assetType, weight: 0, count: 0, evaluationAmount: 0, profit: 0 };
    acc[asset.assetType].weight += asset.weight;
    acc[asset.assetType].count += 1;
    acc[asset.assetType].evaluationAmount += asset.evaluationAmount;
    acc[asset.assetType].profit += asset.profit;
    return acc;
  }, {})).map((entry) => ({
    ...entry,
    weight: round(entry.weight),
    evaluationAmount: round(entry.evaluationAmount),
    profit: round(entry.profit),
  })).sort((a, b) => b.weight - a.weight);
  const positiveContributors = portfolio.assets
    .filter((asset) => asset.profit > 0)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 3)
    .map((asset) => ({ symbol: asset.symbol, name: asset.name, profit: asset.profit, returnRate: asset.returnRate, weight: asset.weight }));
  const negativeContributors = portfolio.assets
    .filter((asset) => asset.profit < 0)
    .sort((a, b) => a.profit - b.profit)
    .slice(0, 3)
    .map((asset) => ({ symbol: asset.symbol, name: asset.name, profit: asset.profit, returnRate: asset.returnRate, weight: asset.weight }));
  const winnerProfit = round(portfolio.assets.filter((asset) => asset.profit > 0).reduce((sum, asset) => sum + asset.profit, 0));
  const loserLoss = round(portfolio.assets.filter((asset) => asset.profit < 0).reduce((sum, asset) => sum + asset.profit, 0));
  const concentrationLevel = topPositionsWeight >= 80 ? 'high' : topPositionsWeight >= 60 ? 'medium' : 'low';

  return {
    totalEvaluation: portfolio.portfolioSummary.totalEvaluation,
    totalInvestment: portfolio.portfolioSummary.totalInvestment,
    totalProfit: portfolio.portfolioSummary.totalProfit,
    totalReturnRate: portfolio.portfolioSummary.totalReturnRate,
    assetsCount: portfolio.assets.length,
    largestPosition: largest ? { name: largest.name, symbol: largest.symbol, weight: largest.weight, profit: largest.profit, returnRate: largest.returnRate } : null,
    topPositions,
    topPositionsWeight,
    concentrationLevel,
    assetTypeWeights,
    profitStructure: {
      winnerProfit,
      loserLoss,
      positiveCount: portfolio.assets.filter((asset) => asset.profit > 0).length,
      negativeCount: portfolio.assets.filter((asset) => asset.profit < 0).length,
    },
    positiveContributors,
    negativeContributors,
  };
}

function enforcePortfolioFacts(aiResult, facts) {
  const safeList = (items) => (Array.isArray(items) ? items : [])
    .filter((item) => typeof item === 'string' && item.trim())
    .map((item) => item.trim())
    .slice(0, 5);

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

function createNewsSummaryFallback(news) {
  const summarySource = news.summary || news.content || news.description || news.title;
  const summary = String(summarySource || '').replace(/\s+/g, ' ').trim().slice(0, 240) || '\uB274\uC2A4 \uB0B4\uC6A9\uC744 \uC694\uC57D\uD560 \uC218 \uC788\uB294 \uC815\uBCF4\uAC00 \uBD80\uC871\uD569\uB2C8\uB2E4.';
  const relatedAssets = news.relatedAssets?.length ? news.relatedAssets.slice(0, 6) : [news.category].filter(Boolean);
  return {
    summary,
    positives: [],
    negatives: [],
    relatedAssets,
    caution: '\uC6D0\uBB38 \uAE30\uC0AC\uC640 \uAD00\uB828 \uACF5\uC2DC\uB97C \uD568\uAED8 \uD655\uC778\uD574 \uC8FC\uC138\uC694.',
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

  try {
    const { value } = await runCachedOpenAi(cacheKey, () => callOpenAi({
      prompt: createNewsSummaryPrompt(news),
      schema: newsSummarySchema,
      schemaName: 'money_platform_news_summary',
      validate: validateNewsSummary,
      userKey: clientKey,
    }));
    return { result: value, cached: false };
  } catch (error) {
    if (['INVALID_JSON', 'INVALID_AI_RESPONSE', 'EMPTY_RESPONSE', 'AI_FAILED'].includes(error?.code)) {
      console.error(JSON.stringify({ event: 'news_ai_fallback', code: error.code }));
      return { result: createNewsSummaryFallback(news), cached: false, fallback: true };
    }
    throw error;
  }
}

function createPortfolioAnalysisFallback(portfolio, facts) {
  const largest = facts.largestPosition;
  const topWeight = round(facts.topPositionsWeight);
  const totalReturnRate = round(portfolio.portfolioSummary.totalReturnRate);
  const mainAssetType = facts.assetTypeWeights[0];
  const contributorText = facts.positiveContributors.length
    ? facts.positiveContributors.map((item) => item.name + '(' + item.symbol + ')').join(', ') + '\uAC00 \uC218\uC775\uC5D0 \uC8FC\uB85C \uAE30\uC5EC\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4.'
    : '\uD604\uC7AC \uD655\uC778\uB418\uB294 \uC8FC\uC694 \uC218\uC775 \uAE30\uC5EC \uC790\uC0B0\uC740 \uC81C\uD55C\uC801\uC785\uB2C8\uB2E4.';
  const lossText = facts.negativeContributors.length
    ? facts.negativeContributors.map((item) => item.name + '(' + item.symbol + ')').join(', ') + '\uC758 \uC190\uC2E4\uC774 \uC804\uCCB4 \uC131\uACFC\uB97C \uC77C\uBD80 \uB0AE\uCD94\uACE0 \uC788\uC2B5\uB2C8\uB2E4.'
    : '\uC190\uC2E4\uC774 \uD06C\uAC8C \uD655\uC778\uB418\uB294 \uC790\uC0B0\uC740 \uC81C\uD55C\uC801\uC785\uB2C8\uB2E4.';
  const concentrationText = topWeight >= 80
    ? '\uC0C1\uC704 3\uAC1C \uC790\uC0B0 \uBE44\uC911\uC774 ' + topWeight + '%\uB85C \uB192\uC544 \uC77C\uBD80 \uC790\uC0B0\uC758 \uAC00\uACA9 \uBCC0\uB3D9\uC774 \uC804\uCCB4 \uD3C9\uAC00\uAE08\uC561\uC5D0 \uD06C\uAC8C \uBC18\uC601\uB420 \uC218 \uC788\uB294 \uAD6C\uC870\uC785\uB2C8\uB2E4.'
    : topWeight >= 60
      ? '\uC0C1\uC704 3\uAC1C \uC790\uC0B0 \uBE44\uC911\uC774 ' + topWeight + '%\uB85C \uC911\uAC04 \uC774\uC0C1\uC758 \uC9D1\uC911\uB3C4\uAC00 \uC788\uC5B4 \uC8FC\uC694 \uC790\uC0B0\uC758 \uC190\uC775 \uBCC0\uD654\uB97C \uD568\uAED8 \uD655\uC778\uD560 \uD544\uC694\uAC00 \uC788\uC2B5\uB2C8\uB2E4.'
      : '\uC0C1\uC704 3\uAC1C \uC790\uC0B0 \uBE44\uC911\uC774 ' + topWeight + '%\uB85C \uC0C1\uB300\uC801\uC73C\uB85C \uBD84\uC0B0\uB41C \uAD6C\uC870\uB85C \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4.';

  return {
    generatedAt: new Date().toISOString(),
    basis: {
      ...portfolio.portfolioSummary,
      assetsCount: facts.assetsCount,
    },
    result: {
      overallSummary: '\uCD1D\uC218\uC775\uB960\uC740 ' + totalReturnRate + '%\uC774\uBA70, \uC774 \uBD84\uC11D\uC740 \uC790\uC0B0\uBCC4 \uBE44\uC911\uACFC \uC190\uC775 \uAE30\uC5EC\uB3C4\uAC00 \uC804\uCCB4 \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uC5D0 \uBBF8\uCE58\uB294 \uC601\uD5A5\uC744 \uC911\uC2EC\uC73C\uB85C \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4.',
      composition: {
        summary: largest ? largest.name + '(' + largest.symbol + ')\uC758 \uBE44\uC911\uC774 ' + largest.weight + '%\uB85C \uAC00\uC7A5 \uD06C\uBA70, ' + (mainAssetType ? mainAssetType.assetType + ' \uC790\uC0B0\uAD70\uC774 ' + mainAssetType.weight + '%\uB97C \uCC28\uC9C0\uD569\uB2C8\uB2E4. ' : '') + '\uB530\uB77C\uC11C \uB2E8\uC77C \uC790\uC0B0\uACFC \uC790\uC0B0\uAD70 \uD3B8\uC911\uC744 \uD568\uAED8 \uBCF4\uB294 \uAD6C\uC870\uC785\uB2C8\uB2E4.' : '\uBCF4\uC720 \uC790\uC0B0 \uBE44\uC911\uC744 \uAE30\uC900\uC73C\uB85C \uAD6C\uC131\uC744 \uD655\uC778\uD588\uC2B5\uB2C8\uB2E4.',
        largestPosition: facts.largestPosition,
        topPositionsWeight: facts.topPositionsWeight,
        assetTypeWeights: facts.assetTypeWeights,
        assetTypeInsights: [concentrationText, ...(mainAssetType ? [mainAssetType.assetType + ' \uBE44\uC911\uC774 ' + mainAssetType.weight + '%\uB85C \uAC00\uC7A5 \uB192\uC544 \uD574\uB2F9 \uC790\uC0B0\uAD70\uC758 \uBCC0\uB3D9\uC131\uC774 \uC804\uCCB4\uC5D0 \uBC18\uC601\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4.'] : [])].slice(0, 5),
      },
      performance: {
        summary: '\uC804\uCCB4 \uC218\uC775\uB960\uB9CC\uBCF4\uB2E4 \uC790\uC0B0\uBCC4 \uC190\uC775 \uAE30\uC5EC\uB3C4\uB97C \uD568\uAED8 \uBCF4\uB294 \uAC83\uC774 \uC911\uC694\uD569\uB2C8\uB2E4. ' + contributorText + ' ' + lossText,
        positiveContributors: facts.positiveContributors.map((item) => item.name + '(' + item.symbol + ')\uC740 \uC218\uC775\uB960 ' + item.returnRate + '%\uC640 \uBE44\uC911 ' + item.weight + '%\uB97C \uAE30\uC900\uC73C\uB85C \uC804\uCCB4 \uC218\uC775\uC5D0 \uAE30\uC5EC\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4.'),
        negativeContributors: facts.negativeContributors.map((item) => item.name + '(' + item.symbol + ')\uC740 \uC190\uC775 ' + item.profit + '\uACFC \uC218\uC775\uB960 ' + item.returnRate + '%\uB97C \uAE30\uC900\uC73C\uB85C \uC131\uACFC\uB97C \uB0AE\uCD94\uB294 \uC694\uC778\uC785\uB2C8\uB2E4.'),
      },
      strengths: totalReturnRate > 0
        ? ['\uC804\uCCB4 \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uAC00 \uC218\uC775 \uAD6C\uAC04\uC5D0 \uC788\uC5B4 \uC77C\uBD80 \uC790\uC0B0\uC758 \uAE0D\uC815\uC801 \uC131\uACFC\uAC00 \uC804\uCCB4 \uD3C9\uAC00\uAE08\uC561\uC5D0 \uBC18\uC601\uB418\uACE0 \uC788\uC2B5\uB2C8\uB2E4.']
        : ['\uD604\uC7AC \uB370\uC774\uD130\uB9CC\uC73C\uB85C\uB294 \uD2B9\uBCC4\uD788 \uAE0D\uC815\uC801\uC774\uB77C\uACE0 \uB2E8\uC815\uD560 \uADFC\uAC70\uAC00 \uC81C\uD55C\uC801\uC774\uBBC0\uB85C \uC911\uB9BD\uC801\uC73C\uB85C \uD655\uC778\uD558\uB294 \uAC83\uC774 \uC801\uC808\uD569\uB2C8\uB2E4.'],
      risks: [
        { title: '\uC9D1\uC911\uB3C4', description: concentrationText, severity: topWeight >= 80 ? 'high' : topWeight >= 60 ? 'medium' : 'low' },
        { title: '\uC190\uC775 \uD3B8\uC911', description: '\uC77C\uBD80 \uC790\uC0B0\uC758 \uC218\uC775\uC774\uB098 \uC190\uC2E4\uC774 \uC804\uCCB4 \uC131\uACFC\uB97C \uD06C\uAC8C \uC124\uBA85\uD558\uB294\uC9C0 \uC790\uC0B0\uBCC4 \uAE30\uC5EC\uB3C4\uB97C \uD568\uAED8 \uBCF4\uC544\uC57C \uD569\uB2C8\uB2E4.', severity: 'medium' },
      ],
      checkpoints: [
        '\uC0C1\uC704 3\uAC1C \uC790\uC0B0 \uBE44\uC911\uC774 \uACC4\uC18D \uB192\uAC8C \uC720\uC9C0\uB418\uB294\uC9C0 \uD655\uC778\uD574 \uC8FC\uC138\uC694.',
        '\uC218\uC775\uC774 \uD2B9\uC815 \uC790\uC0B0\uC5D0\uB9CC \uD3B8\uC911\uB418\uC5B4 \uC788\uB294\uC9C0 \uD655\uC778\uD574 \uC8FC\uC138\uC694.',
        '\uC190\uC2E4 \uAE30\uC5EC \uC790\uC0B0\uC758 \uBE44\uC911\uACFC \uBCC0\uB3D9\uC131\uC744 \uD568\uAED8 \uBCF4\uC544 \uC8FC\uC138\uC694.',
        '\uC790\uC0B0\uAD70\uBCC4 \uBE44\uC911\uC774 \uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uC804\uCCB4 \uB9AC\uC2A4\uD06C\uB97C \uD0A4\uC6B0\uB294 \uAD6C\uC870\uC778\uC9C0 \uD655\uC778\uD574 \uC8FC\uC138\uC694.',
      ],
      disclaimer: portfolioDisclaimer,
    },
  };
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

  try {
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
  } catch (error) {
    if (['INVALID_JSON', 'INVALID_AI_RESPONSE', 'EMPTY_RESPONSE', 'AI_FAILED'].includes(error?.code)) {
      console.error(JSON.stringify({ event: 'portfolio_ai_fallback', code: error.code }));
      return { analysis: createPortfolioAnalysisFallback(portfolio, facts), cached: false, fallback: true };
    }
    throw error;
  }
}


function createInvestmentInsightsFallback(data) {
  const summary = data.portfolioSummary || {};
  const assets = Array.isArray(data.assets) ? data.assets : [];
  const relatedNews = Array.isArray(data.relatedNews) ? data.relatedNews : [];
  const market = Array.isArray(data.market) ? data.market : [];
  const largest = [...assets].sort((a, b) => Number(b.weight || 0) - Number(a.weight || 0))[0];
  const returnRate = round(summary.totalReturnRate);
  return {
    generatedAt: new Date().toISOString(),
    basis: data.portfolioSummary,
    result: {
      summary: '\uBCF4\uC720 \uC790\uC0B0, \uAD00\uB828 \uB274\uC2A4, \uC8FC\uC694 \uC2DC\uC7A5 \uB370\uC774\uD130\uB97C \uAE30\uC900\uC73C\uB85C \uD655\uC778\uD55C \uCC38\uACE0 \uC815\uBCF4\uC785\uB2C8\uB2E4. \uD604\uC7AC \uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uC218\uC775\uB960\uC740 ' + returnRate + '%\uC785\uB2C8\uB2E4.',
      highlights: [
        {
          title: '\uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uAD6C\uC131',
          description: largest ? largest.name + '(' + largest.symbol + ')\uC758 \uBE44\uC911\uC774 ' + largest.weight + '%\uB85C \uAC00\uC7A5 \uD07D\uB2C8\uB2E4.' : '\uBCF4\uC720 \uC790\uC0B0 \uAD6C\uC131\uC744 \uAE30\uC900\uC73C\uB85C \uD655\uC778\uD588\uC2B5\uB2C8\uB2E4.',
          type: 'portfolio',
        },
        {
          title: '\uB274\uC2A4 \uD750\uB984',
          description: relatedNews.length ? '\uAD00\uB828 \uB274\uC2A4 ' + relatedNews.length + '\uAC74\uC744 \uD568\uAED8 \uD655\uC778\uD588\uC2B5\uB2C8\uB2E4.' : '\uD604\uC7AC \uC5F0\uACB0\uB41C \uAD00\uB828 \uB274\uC2A4\uAC00 \uC801\uC5B4 \uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uC790\uB8CC\uB97C \uC911\uC2EC\uC73C\uB85C \uBCF4\uC5EC\uC90D\uB2C8\uB2E4.',
          type: 'news',
        },
        {
          title: '\uC2DC\uC7A5 \uD655\uC778',
          description: market.length ? '\uC8FC\uC694 \uC9C0\uC218 ' + market.length + '\uAC1C\uC758 \uB4F1\uB77D \uD750\uB984\uC744 \uD568\uAED8 \uBCF4\uC5EC\uC90D\uB2C8\uB2E4.' : '\uC2DC\uC7A5 \uB370\uC774\uD130\uB294 \uD655\uC778\uB41C \uBC94\uC704\uC5D0\uC11C\uB9CC \uD45C\uC2DC\uB429\uB2C8\uB2E4.',
          type: 'market',
        },
      ],
      portfolioObservation: largest ? '\uD3EC\uD2B8\uD3F4\uB9AC\uC624\uC5D0\uC11C ' + largest.name + '\uC758 \uBE44\uC911\uC774 \uAC00\uC7A5 \uD06C\uBBC0\uB85C \uC9D1\uC911\uB3C4\uB97C \uD568\uAED8 \uD655\uC778\uD560 \uD544\uC694\uAC00 \uC788\uC2B5\uB2C8\uB2E4.' : '\uBCF4\uC720 \uC790\uC0B0\uC758 \uBE44\uC911\uACFC \uC218\uC775\uB960\uC744 \uAE30\uC900\uC73C\uB85C \uD655\uC778\uD588\uC2B5\uB2C8\uB2E4.',
      newsObservation: relatedNews.length ? '\uAD00\uB828 \uB274\uC2A4\uB294 \uCD5C\uADFC \uD45C\uC2DC\uB41C \uAE30\uC0AC\uB97C \uAE30\uC900\uC73C\uB85C \uCC38\uACE0\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.' : '\uAD00\uB828 \uB274\uC2A4\uAC00 \uBD80\uC871\uD558\uBBC0\uB85C \uC790\uC0B0 \uAD6C\uC131 \uC815\uBCF4\uB97C \uC911\uC2EC\uC73C\uB85C \uBCF4\uC5EC\uC90D\uB2C8\uB2E4.',
      riskChecks: [
        '\uC0C1\uC704 \uBCF4\uC720 \uC790\uC0B0\uC758 \uBE44\uC911\uC774 \uB108\uBB34 \uD06C\uC9C0 \uC54A\uC740\uC9C0 \uD655\uC778\uD574 \uC8FC\uC138\uC694.',
        '\uC790\uC0B0\uBCC4 \uB274\uC2A4\uC640 \uC2DC\uC7A5 \uB4F1\uB77D\uB960\uC744 \uD568\uAED8 \uD655\uC778\uD574 \uC8FC\uC138\uC694.',
        '\uC2E4\uC81C \uD22C\uC790 \uD310\uB2E8 \uC804\uC5D0 \uC6D0\uBB38 \uAE30\uC0AC\uC640 \uACF5\uC2DC\uB97C \uD568\uAED8 \uD655\uC778\uD574 \uC8FC\uC138\uC694.',
      ],
      disclaimer: investmentDisclaimer,
    },
  };
}

export async function createInvestmentInsights(payload, { clientKey = 'anonymous', userHash = 'anonymous', trace } = {}) {
  assertAiAvailable();
  const data = sanitizeInvestmentPayload(payload);
  const cachePayload = { feature: 'investment-insights', userHash, promptVersion: investmentPromptVersion, schemaVersion: investmentSchemaVersion, model, data };
  const cacheKey = `investment-insights:${hashPayload(cachePayload)}`;
  const cached = readAiCache(cacheKey);
  if (cached) return { insights: cached, cached: true };
  assertAiRateLimit(`investment-insights:${clientKey}`);

  try {
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
  } catch (error) {
    if (['INVALID_JSON', 'INVALID_AI_RESPONSE', 'EMPTY_RESPONSE', 'AI_FAILED'].includes(error?.code)) {
      console.error(JSON.stringify({ event: 'investment_ai_fallback', code: error.code }));
      return { insights: createInvestmentInsightsFallback(data), cached: false, fallback: true };
    }
    throw error;
  }
}
