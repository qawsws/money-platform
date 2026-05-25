export default function DetailModal({ open, type, item, onClose }) {
  if (!open || !item) return null;

  const getLabel = () => {
    switch (type) {
      case 'market':
        return '시장 지수 상세 정보';
      case 'crypto':
        return '암호화폐 상세 정보';
      case 'stock':
        return '미국 주식 상세 정보';
      case 'news':
        return '뉴스 전문 보기';
      case 'community':
        return '커뮤니티 글 상세 정보';
      default:
        return '상세 보기';
    }
  };

  const getBody = () => {
    switch (type) {
      case 'market':
        return (
          <>
            <p className="text-gray-300 mb-4">{item.name}의 최신 시장 지수입니다.</p>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-300">
                <span>현재 지수</span>
                <span className="text-white font-semibold">{item.value}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>등락</span>
                <span className={item.isPositive ? 'text-green-400' : 'text-red-400'}>{item.change}</span>
              </div>
              <div className="text-sm text-gray-400">{item.isPositive ? '상승 중인 시장 흐름입니다.' : '하락 중인 시장 흐름입니다.'}</div>
            </div>
          </>
        );
      case 'crypto':
        return (
          <>
            <p className="text-gray-300 mb-4">{item.name}({item.symbol})의 실시간 가격 정보를 확인하세요.</p>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-300">
                <span>현재 가격</span>
                <span className="text-white font-semibold">{item.price}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>변동률</span>
                <span className={item.isPositive ? 'text-green-400' : 'text-red-400'}>{item.change}</span>
              </div>
              <div className="text-sm text-gray-400">{item.isPositive ? '최근 상승세를 보이는 코인입니다.' : '최근 하락세를 보이는 코인입니다.'}</div>
            </div>
          </>
        );
      case 'stock':
        return (
          <>
            <p className="text-gray-300 mb-4">{item.name}({item.symbol}) 종목의 자세한 정보를 제공합니다.</p>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-300">
                <span>현재가</span>
                <span className="text-white font-semibold">{item.price}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>변동률</span>
                <span className={item.isPositive ? 'text-green-400' : 'text-red-400'}>{item.change}</span>
              </div>
              <div className="text-gray-400">{item.description}</div>
            </div>
          </>
        );
      case 'news':
        return (
          <>
            <p className="text-gray-300 mb-4">{item.summary}</p>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-300">
                <span>카테고리</span>
                <span className="text-white font-semibold">{item.category}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>시간</span>
                <span className="text-white font-semibold">{item.time}</span>
              </div>
              <div className="text-sm text-gray-400">중요도: {item.importance}</div>
            </div>
          </>
        );
      case 'community':
        return (
          <>
            <p className="text-gray-300 mb-4">{item.author}님의 글입니다.</p>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-300">
                <span>조회수</span>
                <span className="text-white font-semibold">{item.views}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>좋아요</span>
                <span className="text-white font-semibold">{item.likes}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>댓글</span>
                <span className="text-white font-semibold">{item.comments}</span>
              </div>
              <div className="text-sm text-gray-400">카테고리: {item.category}</div>
            </div>
          </>
        );
      default:
        return <p className="text-gray-300">선택한 항목의 상세 정보를 불러오는 중입니다.</p>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4 sm:px-6">
      <div className="bg-gray-950 rounded-3xl w-full max-w-3xl p-6 border border-gray-700 shadow-2xl text-white">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-blue-400 mb-2">{getLabel()}</p>
            <h2 className="text-2xl font-bold">{item.title || item.name || item.symbol || '상세 정보'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="space-y-4">{getBody()}</div>
      </div>
    </div>
  );
}
