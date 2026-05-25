const BASE = import.meta.env.VITE_API_BASE || '';

async function request(path, opts) {
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export function getMarketIndices() {
  return request('/api/market/indices');
}

export function getCryptoPrices() {
  return request('/api/crypto');
}

export function getUsStocks() {
  return request('/api/stocks/us');
}

export function getNews() {
  return request('/api/news');
}

export function getCommunityPosts() {
  return request('/api/community');
}

export function postCommunityLike(id) {
  return request('/api/community/like', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
}

export function postCommunityView(id) {
  return request('/api/community/view', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
}

// 간단한 로그인 API 호출 (개발용)
export function postLogin({ username, password }) {
  return request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
}
