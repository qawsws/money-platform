// App.jsx - 메인 애플리케이션 컴포넌트
// 투자 정보 플랫폼의 메인 페이지를 구성합니다

import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
const Header = lazy(() => import('./components/Header'));
const MarketIndex = lazy(() => import('./components/MarketIndex'));
const CoinPrice = lazy(() => import('./components/CoinPrice'));
const StockCard = lazy(() => import('./components/StockCard'));
const NewsList = lazy(() => import('./components/NewsList'));
const CommunityPosts = lazy(() => import('./components/CommunityPosts'));
const Footer = lazy(() => import('./components/Footer'));
import SectionDivider from './components/SectionDivider';

const DetailPage = lazy(() => import('./pages/DetailPage'));

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
      <Suspense fallback={<div className="p-6 text-center text-white">로딩 중...</div>}>
        <Header />
      </Suspense>

      <main>
        <Routes location={background || location}>
          <Route path="/" element={(
            <Suspense fallback={<div className="p-8 text-center text-white">로딩 중...</div>}>
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

          <Route path="/detail/:type/:id" element={(
            <Suspense fallback={<div className="p-8 text-center text-white">로딩 중...</div>}>
              <DetailPage />
            </Suspense>
          )} />
        </Routes>
        {background && (
          <Routes>
            <Route path="/detail/:type/:id" element={(
              <Suspense fallback={<div className="p-8 text-center text-white">로딩 중...</div>}>
                <DetailPage />
              </Suspense>
            )} />
          </Routes>
        )}
      </main>

      <Suspense fallback={<div className="p-6 text-center text-white">로딩 중...</div>}>
        <Footer />
      </Suspense>
    </div>
  );
}

export default App;