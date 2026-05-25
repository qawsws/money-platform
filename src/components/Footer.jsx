// Footer 컴포넌트 - 페이지 하단 정보
// 저작권, 링크, 연락처 정보를 표시합니다

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* 회사 정보 */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl font-bold">💰</span>
              <span className="text-lg font-bold text-white">MoneyPlatform</span>
            </div>
            <p className="text-gray-400 text-sm">
              누구나 쉽게 투자 정보를 얻을 수 있는 플랫폼
            </p>
          </div>

          {/* 제품 링크 */}
          <div>
            <h4 className="text-white font-semibold mb-4">제품</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  시장 분석
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  포트폴리오
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  뉴스
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  커뮤니티
                </a>
              </li>
            </ul>
          </div>

          {/* 회사 링크 */}
          <div>
            <h4 className="text-white font-semibold mb-4">회사</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  소개
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  채용
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  블로그
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  문의
                </a>
              </li>
            </ul>
          </div>

          {/* 법적 정보 */}
          <div>
            <h4 className="text-white font-semibold mb-4">법적 정보</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  이용약관
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  개인정보 보호
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  쿠키 정책
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-gray-800 pt-8">
          {/* 저작권 정보 */}
          <div className="text-center text-gray-400 text-sm">
            <p>
              &copy; 2024 MoneyPlatform. 모든 권리 보유. | 본 서비스는 교육용
              목적으로 제공됩니다.
            </p>
          </div>

          {/* 소셜 링크 */}
          <div className="flex justify-center space-x-6 mt-6">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              🐦
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              📘
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              📷
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              🔗
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
