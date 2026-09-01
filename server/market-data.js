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


const firstText = (...values) => values.map((value) => String(value || '').trim()).find(Boolean) || '';
const firstUrl = (values = []) => (values || []).map((value) => String(value || '').trim()).find(Boolean) || '';
const stockCountry = (type) => type === 'korean-stock' ? '\uB300\uD55C\uBBFC\uAD6D' : type === 'stock' ? '\uBBF8\uAD6D' : '';

async function coinAssetProfile(id) {
  const data = await fetchJson(`https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}?localization=true&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`);
  const description = stripTags(firstText(data?.description?.ko, data?.description?.en)).slice(0, 700);
  return {
    source: 'CoinGecko',
    intro: description,
    launchYear: String(data?.genesis_date || '').slice(0, 4),
    usageType: Array.isArray(data?.categories) ? data.categories.filter(Boolean).slice(0, 3).join(', ') : '',
    network: firstText(data?.hashing_algorithm),
    homepage: firstUrl(data?.links?.homepage),
  };
}


async function stockAssetProfile(symbol, type) {
  const querySymbol = type === 'korean-stock' && !String(symbol).includes('.') ? `${symbol}.KS` : symbol;
  const data = await fetchJson(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(querySymbol)}&quotesCount=1&newsCount=0`);
  const quote = (data?.quotes || []).find((item) => item.symbol === querySymbol || item.symbol === symbol) || data?.quotes?.[0] || {};
  return {
    source: 'Yahoo Finance',
    companyName: firstText(quote.longname, quote.shortname),
    industry: firstText(quote.industryDisp, quote.industry),
    business: firstText(quote.sectorDisp, quote.sector),
    country: stockCountry(type),
    exchange: firstText(quote.exchDisp, quote.exchange),
  };
}

export async function getAssetProfileLive({ type = '', id = '', symbol = '' } = {}) {
  return cached(`asset-profile:${type}:${id}:${symbol}`, async () => {
    try {
      if (type === 'crypto') {
        const fallbackCoin = cryptoPrices.find((coin) => String(coin.id) === String(id) || coin.symbol === symbol || coin.coingeckoId === id);
        const coinId = fallbackCoin?.coingeckoId || id;
        if (!coinId) return { source: 'CoinGecko', profile: null };
        return { source: 'CoinGecko', profile: await coinAssetProfile(coinId) };
      }
      if (type === 'stock' || type === 'korean-stock') {
        if (!symbol) return { source: 'Yahoo Finance', profile: null };
        return { source: 'Yahoo Finance', profile: await stockAssetProfile(symbol, type) };
      }
      return { source: '', profile: null };
    } catch (error) {
      return { source: type === 'crypto' ? 'CoinGecko' : 'Yahoo Finance', profile: null, fallbackReason: reason(error) };
    }
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
    return live(await yahooQuotes(koreanStocks, koreanStocks.map((item) => `${item.symbol}.KS`), '\u20a9'), 'Yahoo Finance');
  } catch (error) {
    return fallback(koreanStocks, 'Yahoo Finance', error);
  }
  });
}

export async function getNewsLive() {
  return cached('news', async () => {
  try {
    const feeds = [
      { query: '\uD55C\uAD6D \uC99D\uC2DC OR \uCF54\uC2A4\uD53C OR \uC0BC\uC131\uC804\uC790 OR SK\uD558\uC774\uB2C9\uC2A4', category: '\uAD6D\uB0B4\uC99D\uC2DC' },
      { query: '\uBBF8\uAD6D \uC99D\uC2DC OR \uB098\uC2A4\uB2E5 OR \uC560\uD50C OR \uBE44\uD2B8\uCF54\uC778', category: '\uD574\uC678\uC99D\uC2DC' },
      { query: '\uD22C\uC790 OR \uAE08\uB9AC OR \uD658\uC728 OR \uCC44\uAD8C', category: '\uACBD\uC81C' },
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
      const summary = stripTags(item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '') || [source, date].filter(Boolean).join(' - ');
      return {
        id: index + 1,
        title,
        summary,
        category,
        time: '\uC2E4\uC2DC\uAC04',
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
    check('asset-profile', 'Yahoo Finance / CoinGecko', () => Promise.all([stockAssetProfile('AAPL', 'stock'), coinAssetProfile('bitcoin')])),
    check('news', 'Google News RSS', () => fetchText(`https://news.google.com/rss/search?q=${encodeURIComponent('\uD55C\uAD6D \uC99D\uC2DC')}&hl=ko&gl=KR&ceid=KR:ko`)),
  ]);
  return { checkedAt: new Date().toISOString(), statuses };
}
