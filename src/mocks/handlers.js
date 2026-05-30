import { http, HttpResponse } from 'msw';
import { marketIndices, cryptoPrices, usStocks, newsList, communityPosts } from '../mock/marketData';

const findPost = (id) => communityPosts.find((post) => post.id === id);

export const handlers = [
  http.get('/api/market/indices', () => HttpResponse.json(marketIndices)),
  http.get('/api/crypto', () => HttpResponse.json(cryptoPrices)),
  http.get('/api/stocks/us', () => HttpResponse.json(usStocks)),
  http.get('/api/news', () => HttpResponse.json(newsList)),
  http.get('/api/community', () => HttpResponse.json(communityPosts)),
  http.post('/api/community/like', async ({ request }) => {
    const { id } = await request.json();
    const post = findPost(id);
    if (!post) return HttpResponse.json({ success: false }, { status: 404 });
    post.likes = String((parseInt(post.likes, 10) || 0) + 1);
    return HttpResponse.json({ success: true, post });
  }),
  http.post('/api/community/view', async ({ request }) => {
    const { id } = await request.json();
    const post = findPost(id);
    if (!post) return HttpResponse.json({ success: false }, { status: 404 });
    post.views = String((parseInt(post.views, 10) || 0) + 1);
    return HttpResponse.json({ success: true, post });
  }),
];
