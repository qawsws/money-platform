import { cryptoPrices, koreanStocks, marketIndices, newsList, usStocks } from '../src/mock/marketData.js';

const timeout = Number(process.env.MARKET_TIMEOUT_MS || 12_000);
const cacheMs = Number(process.env.MARKET_CACHE_MS || 60_000);
const cache = new Map();

async function cached(key, loader) {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.time < cacheMs) return hit.data;
  const data = await loader();
  cache.set(key, { time: now, data });
  return data;
}

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeout) });
  if (!response.ok) throw new Error(response.statusText);
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeout) });
  if (!response.ok) throw new Error(response.statusText);
  return response.text();
}

const reason = (error) => error?.cause?.code || error?.message || error?.name || 'unknown';
const live = (items, provider) => items.map((item) => ({ ...item, dataSource: 'live', provider }));
const fallback = (items, provider, error) => items.map((item) => ({ ...item, dataSource: 'fallback', provider, fallbackReason: reason(error) }));
const decodeXml = (value = '') => value.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const stripTags = (value = '') => decodeXml(value).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

async function yahooChart(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`;
  const data = await fetchJson(url);
  const result = data?.chart?.result?.[0];
  const meta = result?.meta;
  if (!meta?.regularMarketPrice) throw new Error('empty quote');
  const current = Number(meta.regularMarketPrice);
  const previous = Number(meta.chartPreviousClose || meta.previousClose || current);
  const percent = previous ? ((current - previous) / previous) * 100 : 0;
  const prices = (result?.indicators?.quote?.[0]?.close || []).filter((value) => Number.isFinite(Number(value))).map(Number);
  const history = prices.slice(-30);
  return { value: current, change: `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`, isPositive: percent >= 0, priceHistory: history.length > 1 ? history : [previous, current] };
}

async function yahooQuotes(items, symbols, currency = '$') {
  const quotes = await Promise.all(symbols.map((symbol) => yahooChart(symbol)));
  return items.map((item, index) => {
    const quote = quotes[index];
    return {
      ...item,
      price: `${currency}${quote.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      change: quote.change,
      isPositive: quote.isPositive,
      priceHistory: quote.priceHistory,
    };
  });
}

export async function getMarketIndicesLive() {
  return cached('market-indices', async () => {
  try {
    const quotes = await Promise.all(['^GSPC', '^IXIC', '^DJI', '^KS11'].map((symbol) => yahooChart(symbol)));
    return live(marketIndices.map((item, index) => {
      const quote = quotes[index];
      return { ...item, value: quote.value.toLocaleString(undefined, { maximumFractionDigits: 2 }), change: quote.change, isPositive: quote.isPositive };
    }), 'Yahoo Finance');
  } catch (error) {
    return fallback(marketIndices, 'Yahoo Finance', error);
  }
  });
}

export async function getCryptoPricesLive() {
  return cached('crypto-prices', async () => {
  try {
    const ids = cryptoPrices.map((coin) => coin.coingeckoId || coin.id).filter(Boolean);
    const data = await fetchJson(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids.join(',')}&order=market_cap_desc&per_page=${ids.length}&page=1&sparkline=true&price_change_percentage=24h`);
    return live(data.map((coin) => {
      const change = Number(coin.price_change_percentage_24h || 0);
      const fallback = cryptoPrices.find((item) => item.symbol.toLowerCase() === coin.symbol.toLowerCase()) || {};
      return {
        ...fallback,
        id: fallback.id || coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        price: `$${Number(coin.current_price).toLocaleString()}`,
        change: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
        isPositive: change >= 0,
        image: coin.symbol.toUpperCase(),
        priceHistory: coin.sparkline_in_7d?.price?.slice(-30) || [],
      };
    }), 'CoinGecko');
  } catch (error) {
    return fallback(cryptoPrices, 'CoinGecko', error);
  }
  });
}

export async function getUsStocksLive() {
  return cached('us-stocks', async () => {
  try {
    return live(await yahooQuotes(usStocks, usStocks.map((item) => item.symbol), '$'), 'Yahoo Finance');
  } catch (error) {
    return fallback(usStocks, 'Yahoo Finance', error);
  }
  });
}

export async function getKoreanStocksLive() {
  return cached('korean-stocks', async () => {
  try {
    return live(await yahooQuotes(koreanStocks, koreanStocks.map((item) => `${item.symbol}.KS`), '₩'), 'Yahoo Finance');
  } catch (error) {
    return fallback(koreanStocks, 'Yahoo Finance', error);
  }
  });
}

export async function getNewsLive() {
  return cached('news', async () => {
  try {
    const feeds = [
      { query: '한국 증시 OR 코스피 OR 삼성전자 OR SK하이닉스', category: '국내증시' },
      { query: '미국증시 OR 나스닥 OR 연준 OR 비트코인', category: '해외증시' },
      { query: '투자 OR 금리 OR 환율 OR 채권', category: '경제' },
    ];
    const xmls = await Promise.all(feeds.map((feed) => fetchText(`https://news.google.com/rss/search?q=${encodeURIComponent(feed.query)}&hl=ko&gl=KR&ceid=KR:ko`).then((xml) => ({ ...feed, xml }))));
    const items = xmls.flatMap((feed) => [...feed.xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 6).map((match) => ({ item: match[1], category: feed.category })));
    if (items.length === 0) return fallback(newsList, 'Google News RSS', new Error('empty response'));
    const seen = new Set();
    return live(items.map(({ item, category }, index) => {
      const rawTitle = decodeXml(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || newsList[index]?.title || '');
      const title = rawTitle.replace(/\s+-\s+[^-]+$/, '').trim();
      const link = decodeXml(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '');
      const source = decodeXml(item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || '');
      const date = decodeXml(item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '');
      const summary = stripTags(item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '') || [source, date].filter(Boolean).join(' · ');
      return {
        id: index + 1,
        title,
        summary,
        category,
        time: '실시간',
        importance: index < 3 ? 'high' : 'medium',
        url: link,
      };
    }).filter((article) => {
      const key = article.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 16), 'Google News RSS');
  } catch (error) {
    return fallback(newsList, 'Google News RSS', error);
  }
  });
}

async function check(name, provider, load) {
  try {
    await load();
    return { name, provider, ok: true };
  } catch (error) {
    return { name, provider, ok: false, reason: reason(error) };
  }
}

export async function getMarketDataStatus() {
  const statuses = await Promise.all([
    check('crypto', 'CoinGecko', () => fetchJson('https://api.coingecko.com/api/v3/ping')),
    check('stocks', 'Yahoo Finance', () => fetchJson('https://query1.finance.yahoo.com/v8/finance/chart/AAPL?range=1d&interval=1d')),
    check('news', 'Google News RSS', () => fetchText(`https://news.google.com/rss/search?q=${encodeURIComponent('한국 증시')}&hl=ko&gl=KR&ceid=KR:ko`)),
  ]);
  return { checkedAt: new Date().toISOString(), statuses };
}
