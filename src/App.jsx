import { lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import SectionDivider from './components/SectionDivider';

const Header = lazy(() => import('./components/Header'));
const MarketIndex = lazy(() => import('./components/MarketIndex'));
const CoinPrice = lazy(() => import('./components/CoinPrice'));
const StockCard = lazy(() => import('./components/StockCard'));
const NewsList = lazy(() => import('./components/NewsList'));
const CommunityPosts = lazy(() => import('./components/CommunityPosts'));
const Footer = lazy(() => import('./components/Footer'));
const DetailPage = lazy(() => import('./pages/DetailPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));

const Loading = ({ className = 'p-8' }) => (
  <div className={`${className} text-center text-white`}>로딩 중...</div>
);

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const background = location.state && location.state.background;

  const openDetail = (type, item) => {
    const id = item?.id ?? item?.symbol ?? item?.title ?? '0';
    navigate(`/detail/${type}/${encodeURIComponent(String(id))}`, { state: { item, background: location } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <Suspense fallback={<Loading className="p-6" />}>
        <Header />
      </Suspense>

      <main>
        <Routes location={background || location}>
          <Route path="/" element={(
            <Suspense fallback={<Loading />}>
              <MarketIndex onOpenDetail={(item) => openDetail('market', item)} />
              <SectionDivider />
              <CoinPrice onOpenDetail={(item) => openDetail('crypto', item)} />
              <SectionDivider />
              <StockCard onOpenDetail={(item) => openDetail('stock', item)} />
              <SectionDivider />
              <NewsList onOpenDetail={(item) => openDetail('news', item)} />
              <SectionDivider />
              <CommunityPosts onOpenDetail={(item) => openDetail('community', item)} />
            </Suspense>
          )} />
          <Route path="/favorites" element={(
            <Suspense fallback={<Loading />}>
              <FavoritesPage />
            </Suspense>
          )} />
          <Route path="/portfolio" element={(
            <Suspense fallback={<Loading />}>
              <PortfolioPage />
            </Suspense>
          )} />
          <Route path="/detail/:type/:id" element={(
            <Suspense fallback={<Loading />}>
              <DetailPage />
            </Suspense>
          )} />
        </Routes>
        {background && (
          <Routes>
            <Route path="/detail/:type/:id" element={(
              <Suspense fallback={<Loading />}>
                <DetailPage />
              </Suspense>
            )} />
          </Routes>
        )}
      </main>

      <Suspense fallback={<Loading className="p-6" />}>
        <Footer />
      </Suspense>
    </div>
  );
}

export default App;
