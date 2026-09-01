const BASE = import.meta.env.VITE_API_BASE || '';

async function request(path, opts) {
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const error = new Error(body?.message || body?.error?.message || res.statusText);
    error.code = body?.error?.code;
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export const getMarketIndices = () => request('/api/market/indices');
export const getMarketStatus = () => request('/api/market/status');
export const getCryptoPrices = () => request('/api/crypto');
export const getUsStocks = () => request('/api/stocks/us');
export const getKoreanStocks = () => request('/api/stocks/kr');
export const getNews = () => request('/api/news');
export const getAssetProfile = ({ type, id, symbol }) => request('/api/asset-profile?type=' + encodeURIComponent(type || '') + '&id=' + encodeURIComponent(id || '') + '&symbol=' + encodeURIComponent(symbol || ''));
export const getCommunityPosts = () => request('/api/community');
export const getAnnouncements = () => request('/api/announcements');

export const postNewsAiSummary = (news) => request('/api/ai/news-summary', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(news),
});

export const postPortfolioAiAnalysis = (token, portfolio) => request('/api/ai/portfolio-analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(portfolio),
});

export const requestInvestmentInsights = (token) => request('/api/ai/investment-insights', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({}),
});

export const createCommunityPost = (token, post) => request('/api/community', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(post),
});

export const getCommunityComments = (postId) => request(`/api/community/comments?postId=${encodeURIComponent(postId)}`);

export const createCommunityComment = (token, postId, content) => request('/api/community/comment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ postId, content }),
});

export const deleteCommunityPost = (token, id) => request('/api/community', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ id }),
});

export const deleteCommunityComment = (token, id) => request('/api/community/comment', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ id }),
});

export const createContentReport = (token, report) => request('/api/reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(report),
});

export const postCommunityLike = (id) => request('/api/community/like', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id }),
});

export const postCommunityUnlike = (id) => request('/api/community/unlike', {
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

export const getDashboard = (token) => request('/api/me/dashboard', {
  headers: { Authorization: `Bearer ${token}` },
});

export const updateProfile = (token, profile) => request('/api/me/profile', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(profile),
});

export const updatePassword = (token, payload) => request('/api/me/password', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(payload),
});

export const deleteAccount = (token, password) => request('/api/me', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ password }),
});

export const getAdminDashboard = (token) => request('/api/admin/dashboard', {
  headers: { Authorization: `Bearer ${token}` },
});

export const deleteAdminUser = (token, id) => request('/api/admin/users', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ id }),
});

export const updateAdminUserRole = (token, id, isAdmin) => request('/api/admin/users/role', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ id, isAdmin }),
});

export const saveAdminUserNote = (token, id, note) => request('/api/admin/users/note', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ id, note }),
});

export const deleteAdminCommunityPost = (token, id) => request('/api/admin/community', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ id }),
});

export const updateAdminCommunityPostVisibility = (token, id, isHidden) => request('/api/admin/community/visibility', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ id, isHidden }),
});

export const createAdminAnnouncement = (token, notice) => request('/api/admin/announcements', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(notice),
});

export const updateAdminAnnouncement = (token, notice) => request('/api/admin/announcements', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(notice),
});

export const updateAdminAnnouncementVisibility = (token, id, isHidden) => request('/api/admin/announcements/visibility', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ id, isHidden }),
});

export const deleteAdminAnnouncement = (token, id) => request('/api/admin/announcements', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ id }),
});

export const updateAdminReportStatus = (token, id, status) => request('/api/admin/reports/status', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ id, status }),
});

export const deleteAdminReport = (token, id) => request('/api/admin/reports', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ id }),
});

export const deleteAdminCommunityComment = (token, id) => request('/api/admin/community/comment', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ id }),
});

export const getFavorites = (token) => request('/api/favorites', {
  headers: { Authorization: `Bearer ${token}` },
});

export const postFavoriteToggle = (token, id) => request('/api/favorites/toggle', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ id }),
});

export const getPortfolio = (token) => request('/api/portfolio', {
  headers: { Authorization: `Bearer ${token}` },
});

export const savePortfolioHolding = (token, holding) => request('/api/portfolio', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(holding),
});

export const deletePortfolioHolding = (token, itemKey) => request('/api/portfolio', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ itemKey }),
});

export const getAssetNote = (token, itemKey) => request(`/api/asset-note?itemKey=${encodeURIComponent(itemKey)}`, {
  headers: { Authorization: `Bearer ${token}` },
});

export const saveAssetNote = (token, itemKey, note) => request('/api/asset-note', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ itemKey, note }),
});

export const getSavedNews = (token) => request('/api/saved-news', {
  headers: { Authorization: `Bearer ${token}` },
});

export const toggleSavedNews = (token, news) => request('/api/saved-news/toggle', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(news),
});

export const deleteSavedNews = (token, newsKey) => request('/api/saved-news', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ newsKey }),
});
