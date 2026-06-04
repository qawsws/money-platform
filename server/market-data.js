import { communityPosts, cryptoPrices, marketIndices, newsList, usStocks } from '../src/mock/marketData.js';

const timeout = 5000;

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

function csvRows(text) {
  const [head, ...rows] = text.trim().split(/\r?\n/).map((line) => line.split(','));
  return rows.map((row) => Object.fromEntries(head.map((key, index) => [key, row[index]])));
}

function pct(value, fallback) {
  const text = String(value || '').trim();
  if (!text || text === 'N/D') return fallback;
  return text.endsWith('%') ? text : `${text}%`;
}

async function stooq(symbols) {
  const url = `https://stooq.com/q/l/?s=${symbols.join('+')}&f=sd2t2lcpn&h&e=csv`;
  return csvRows(await fetchText(url));
}

export async function getMarketIndicesLive() {
  try {
    const rows = await stooq(['^spx', '^ndq', '^dji', '^ks11']);
    return marketIndices.map((item, index) => {
      const row = rows[index] || {};
      const value = row.Last && row.Last !== 'N/D' ? Number(row.Last).toLocaleString() : item.value;
      const change = pct(row.Percent, item.change);
      return { ...item, value, change, isPositive: !String(change).startsWith('-') };
    });
  } catch {
    return marketIndices;
  }
}

export async function getCryptoPricesLive() {
  try {
    const data = await fetchJson('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,ripple&order=market_cap_desc&per_page=3&page=1&sparkline=false&price_change_percentage=24h');
    return data.map((coin, index) => {
      const change = Number(coin.price_change_percentage_24h || 0);
      return {
        ...cryptoPrices[index],
        id: cryptoPrices[index]?.id || coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        price: `$${Number(coin.current_price).toLocaleString()}`,
        change: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
        isPositive: change >= 0,
        image: coin.symbol.toUpperCase(),
      };
    });
  } catch {
    return cryptoPrices;
  }
}

export async function getUsStocksLive() {
  try {
    const rows = await stooq(['aapl.us', 'googl.us', 'msft.us', 'tsla.us']);
    return usStocks.map((item, index) => {
      const row = rows[index] || {};
      const change = pct(row.Percent, item.change);
      return {
        ...item,
        price: row.Last && row.Last !== 'N/D' ? `$${Number(row.Last).toLocaleString()}` : item.price,
        change,
        isPositive: !String(change).startsWith('-'),
      };
    });
  } catch {
    return usStocks;
  }
}

export async function getNewsLive() {
  try {
    const data = await fetchJson('https://api.gdeltproject.org/api/v2/doc/doc?query=stock%20market%20OR%20federal%20reserve%20OR%20bitcoin&mode=ArtList&format=json&maxrecords=8&sort=HybridRel');
    const articles = Array.isArray(data.articles) ? data.articles.slice(0, 5) : [];
    if (articles.length === 0) return newsList;
    return articles.map((article, index) => ({
      id: index + 1,
      title: article.title || newsList[index]?.title,
      summary: article.seendate ? `${article.domain || 'news'} · ${article.seendate}` : (article.url || ''),
      category: '글로벌',
      time: '실시간',
      importance: index < 2 ? 'high' : 'medium',
      url: article.url,
    }));
  } catch {
    return newsList;
  }
}

export function getCommunityPostsLive() {
  return communityPosts;
}
