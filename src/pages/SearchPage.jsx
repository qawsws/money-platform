import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSkeleton from '../components/LoadingSkeleton';
import SectionHeader from '../components/SectionHeader';
import { useSearch } from '../context/SearchContext';
import { getCommunityPosts, getCryptoPrices, getKoreanStocks, getMarketIndices, getNews, getUsStocks } from '../services/api';

const labels = {
  title: '통합 검색',
  empty: '검색어와 일치하는 결과가 없습니다.',
  market: '시장',
  crypto: '코인',
  stock: '미국 주식',
  koreanStock: '한국 주식',
  news: '뉴스',
  community: '커뮤니티',
};

const searchable = (...values) => values.join(' ').toLowerCase();

export default function SearchPage() {
  const { query } = useSearch();
  const location = useLocation();
  const navigate = useNavigate();
  const keyword = query.trim().toLowerCase();

  const market = useQuery({ queryKey: ['market', 'indices'], queryFn: getMarketIndices });
  const crypto = useQuery({ queryKey: ['crypto'], queryFn: getCryptoPrices });
  const stocks = useQuery({ queryKey: ['stocks', 'us'], queryFn: getUsStocks });
  const koreanStocks = useQuery({ queryKey: ['stocks', 'kr'], queryFn: getKoreanStocks });
  const news = useQuery({ queryKey: ['news'], queryFn: getNews });
  const community = useQuery({ queryKey: ['community', 'posts'], queryFn: getCommunityPosts });
  const queries = [market, crypto, stocks, koreanStocks, news, community];
  const isLoading = queries.some((entry) => entry.isLoading);
  const error = queries.find((entry) => entry.error)?.error;

  const results = useMemo(() => {
    if (!keyword) return [];
    return [
      ...(market.data || []).map((item) => ({ type: 'market', label: labels.market, title: item.name, meta: item.value, item })),
      ...(crypto.data || []).map((item) => ({ type: 'crypto', label: labels.crypto, title: item.name, meta: `${item.symbol} · ${item.price}`, item })),
      ...(stocks.data || []).map((item) => ({ type: 'stock', label: labels.stock, title: item.symbol, meta: `${item.name} · ${item.description}`, item })),
      ...(koreanStocks.data || []).map((item) => ({ type: 'korean-stock', label: labels.koreanStock, title: item.symbol, meta: `${item.name} · ${item.description}`, item })),
      ...(news.data || []).map((item) => ({ type: 'news', label: labels.news, title: item.title, meta: `${item.category} · ${item.summary}`, item })),
      ...(community.data || []).map((item) => ({ type: 'community', label: labels.community, title: item.title, meta: `${item.author} · ${item.content}`, item })),
    ].filter((entry) => searchable(entry.title, entry.meta).includes(keyword));
  }, [community.data, crypto.data, keyword, koreanStocks.data, market.data, news.data, stocks.data]);

  const open = (result) => {
    const id = result.item?.id ?? result.item?.symbol ?? result.item?.title ?? '0';
    navigate(`/detail/${result.type}/${encodeURIComponent(String(id))}`, { state: { item: result.item, background: location } });
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeader title={labels.title} description={keyword ? `"${query}" 검색 결과 ${results.length}개` : '헤더 검색창에 검색어를 입력해 주세요.'} />
      {isLoading && <LoadingSkeleton className="h-40 p-5" />}
      {error && <ErrorMessage error={error} />}
      {!isLoading && !error && keyword && results.length === 0 && <p className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">{labels.empty}</p>}
      {!isLoading && !error && results.length > 0 && (
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <div className="divide-y divide-slate-100">
            {results.map((result, index) => (
              <button key={`${result.type}-${index}`} type="button" onClick={() => open(result)} className="block w-full px-4 py-4 text-left hover:bg-blue-50/50">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{result.label}</span>
                <b className="mt-2 block text-slate-950">{result.title}</b>
                <p className="mt-1 line-clamp-1 text-sm text-slate-500">{result.meta}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
