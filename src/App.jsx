import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import SectionDivider from './components/SectionDivider';

const Header = lazy(() => import('./components/Header'));
const Announcements = lazy(() => import('./components/Announcements'));
const HomeSummary = lazy(() => import('./components/HomeSummary'));
const MarketIndex = lazy(() => import('./components/MarketIndex'));
const CoinPrice = lazy(() => import('./components/CoinPrice'));
const StockCard = lazy(() => import('./components/StockCard'));
const KoreanStockCard = lazy(() => import('./components/KoreanStockCard'));
const NewsList = lazy(() => import('./components/NewsList'));
const CommunityPosts = lazy(() => import('./components/CommunityPosts'));
const Footer = lazy(() => import('./components/Footer'));
const MarketPage = lazy(() => import('./pages/MarketPage'));
const CryptoPage = lazy(() => import('./pages/CryptoPage'));
const StocksPage = lazy(() => import('./pages/StocksPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const DetailPage = lazy(() => import('./pages/DetailPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const MyPage = lazy(() => import('./pages/MyPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

const Loading = () => <div className="p-10 text-center text-sm text-slate-500">{'\uBD88\uB7EC\uC624\uB294 \uC911...'}</div>;
const NotFound = () => (
  <section className="mx-auto grid min-h-[55vh] max-w-7xl place-items-center px-4 py-16 text-center sm:px-6 lg:px-8">
    <div className="min-w-0 max-w-full">
      <p className="text-sm font-black uppercase text-[var(--color-primary)]">404</p>
      <h1 className="mt-3 break-words text-3xl font-black tracking-tight text-[var(--color-text-primary)]">페이지를 찾을 수 없습니다.</h1>
      <p className="mt-3 break-words text-sm leading-6 text-[var(--color-text-secondary)]">요청한 경로가 변경되었거나 존재하지 않습니다.</p>
      <a href="/" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white transition hover:bg-[var(--color-primary-hover)]">
        홈으로 이동
      </a>
    </div>
  </section>
);

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const background = location.state?.background;
  const openDetail = (type, item) => {
    const id = item?.id ?? item?.symbol ?? item?.title ?? '0';
    navigate(`/detail/${type}/${encodeURIComponent(String(id))}`, { state: { item, background: location } });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <ScrollToTop />
      <Suspense fallback={<Loading />}><Header /></Suspense>
      <main className="flex-1">
        <Routes location={background || location}>
          <Route path="/" element={<Suspense fallback={<Loading />}><HomeSummary /><Announcements /><MarketIndex limit={4} showMore onOpenDetail={(item) => openDetail('market', item)} /><SectionDivider /><CoinPrice limit={3} showMore onOpenDetail={(item) => openDetail('crypto', item)} /><SectionDivider /><StockCard limit={4} showMore onOpenDetail={(item) => openDetail('stock', item)} /><SectionDivider /><KoreanStockCard limit={4} showMore onOpenDetail={(item) => openDetail('korean-stock', item)} /><SectionDivider /><section className="py-7"><div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)] lg:px-8"><NewsList contained={false} limit={4} showMore onOpenDetail={(item) => openDetail('news', item)} /><CommunityPosts contained={false} limit={3} showMore onOpenDetail={(item) => openDetail('community', item)} /></div></section></Suspense>} />
          <Route path="/market" element={<Suspense fallback={<Loading />}><MarketPage /></Suspense>} />
          <Route path="/crypto" element={<Suspense fallback={<Loading />}><CryptoPage /></Suspense>} />
          <Route path="/stocks/:market" element={<Suspense fallback={<Loading />}><StocksPage /></Suspense>} />
          <Route path="/news" element={<Suspense fallback={<Loading />}><NewsPage /></Suspense>} />
          <Route path="/community" element={<Suspense fallback={<Loading />}><CommunityPage /></Suspense>} />
          <Route path="/search" element={<Suspense fallback={<Loading />}><SearchPage /></Suspense>} />
          <Route path="/favorites" element={<Suspense fallback={<Loading />}><FavoritesPage /></Suspense>} />
          <Route path="/portfolio" element={<Suspense fallback={<Loading />}><PortfolioPage /></Suspense>} />
          <Route path="/mypage" element={<Suspense fallback={<Loading />}><MyPage /></Suspense>} />
          <Route path="/admin" element={<Suspense fallback={<Loading />}><AdminPage /></Suspense>} />
          <Route path="/detail/:type/:id" element={<Suspense fallback={<Loading />}><DetailPage /></Suspense>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        {background && <Routes><Route path="/detail/:type/:id" element={<Suspense fallback={<Loading />}><DetailPage /></Suspense>} /></Routes>}
      </main>
      <Suspense fallback={<Loading />}><Footer /></Suspense>
    </div>
  );
}

export default App;
