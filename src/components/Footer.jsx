import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><Link to="/" className="text-lg font-bold text-white">MoneyPlatform</Link><p className="text-gray-400 text-sm mt-2">투자 정보를 한곳에서 간편하게 확인하세요.</p></div>
          <nav className="flex flex-wrap gap-4 text-sm text-gray-400"><a href="#market" className="hover:text-white">시장</a><a href="#news" className="hover:text-white">뉴스</a><a href="#community" className="hover:text-white">커뮤니티</a><Link to="/portfolio" className="hover:text-white">포트폴리오</Link><Link to="/favorites" className="hover:text-white">즐겨찾기</Link></nav>
        </div>
        <p className="border-t border-gray-800 pt-6 mt-6 text-center text-gray-500 text-sm">&copy; 2026 MoneyPlatform. 교육용 투자 정보 서비스입니다.</p>
      </div>
    </footer>
  );
}
