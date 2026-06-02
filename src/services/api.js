const BASE = import.meta.env.VITE_API_BASE || '';

async function request(path, opts) {
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || res.statusText);
  }
  return res.json();
}

export const getMarketIndices = () => request('/api/market/indices');
export const getCryptoPrices = () => request('/api/crypto');
export const getUsStocks = () => request('/api/stocks/us');
export const getNews = () => request('/api/news');
export const getCommunityPosts = () => request('/api/community');

export const postCommunityLike = (id) => request('/api/community/like', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id }),
});

export const postCommunityView = (id) => request('/api/community/view', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id }),
});

export const postLogin = ({ username, password }) => request('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password }),
});

export const postSignup = (profile) => request('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(profile),
});

export const getCurrentUser = (token) => request('/api/auth/me', {
  headers: { Authorization: `Bearer ${token}` },
});
