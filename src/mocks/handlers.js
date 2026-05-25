import { http } from 'msw';
import {
  marketIndices,
  cryptoPrices,
  usStocks,
  newsList,
  communityPosts,
} from '../mock/marketData';

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// 간단한 MSW 핸들러: 실제 API 경로와 비슷하게 구성
export const handlers = [
  http.get('/api/market/indices', () => jsonResponse(marketIndices)),

  http.get('/api/crypto', () => jsonResponse(cryptoPrices)),

  http.get('/api/stocks/us', () => jsonResponse(usStocks)),

  http.get('/api/news', () => jsonResponse(newsList)),

  http.get('/api/community', () => jsonResponse(communityPosts)),

  // 커뮤니티 좋아요 증가 (POST /api/community/like)
  http.post('/api/community/like', async (req) => {
    const rawBody = req.body ?? (typeof req.json === 'function' ? await req.json() : undefined);
    const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    const { id } = body || {};
    const post = communityPosts.find((p) => p.id === id);
    if (post) {
      // 간단히 메모리 데이터 변경
      post.likes = typeof post.likes === 'string' ? post.likes : post.likes;
      // likes는 문자열로 표기된 경우가 있으므로 숫자로 변환하거나 증가시키기 쉽도록 맞춤 처리
      const numeric = parseInt(String(post.likes).replace(/[^0-9]/g, '')) || 0;
      post.likes = `${numeric + 1}`;
      return jsonResponse({ success: true, post });
    }
    return jsonResponse({ success: false }, 404);
  }),

  // 커뮤니티 조회수 증가 (POST /api/community/view)
  http.post('/api/community/view', async (req) => {
    const rawBody = req.body ?? (typeof req.json === 'function' ? await req.json() : undefined);
    const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    const { id } = body || {};
    const post = communityPosts.find((p) => p.id === id);
    if (post) {
      const numeric = parseInt(String(post.views).replace(/[^0-9]/g, '')) || 0;
      post.views = `${numeric + 1}`;
      return jsonResponse({ success: true, post });
    }
    return jsonResponse({ success: false }, 404);
  }),

  // 인증: 간단한 로그인 핸들러 (개발용)
  http.post('/api/auth/login', async (req) => {
    const rawBody = req.body ?? (typeof req.json === 'function' ? await req.json() : undefined);
    const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    const { username, password } = body || {};
    // 간단 검증: 비밀번호가 'password'이면 성공
    if (username && password === 'password') {
      const user = { username, displayName: username };
      return jsonResponse({ success: true, user, token: 'dev-token' });
    }
    return jsonResponse({ success: false, message: 'Invalid credentials' }, 401);
  }),
];
