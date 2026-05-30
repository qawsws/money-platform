import { useFavoritesStore } from '../store/favoritesStore';

export default function DetailModal({ open, type, item, onClose }) {
  const favorites = useFavoritesStore((s) => s.favorites);
  const toggle = useFavoritesStore((s) => s.toggle);
  if (!open || !item) return null;

  const favoriteKey = `${type}:${item.id ?? item.symbol ?? item.title}`;
  const isFavorite = favorites.includes(favoriteKey);
  const labels = { market: '시장 지수', crypto: '암호화폐', stock: '미국 주식', news: '뉴스', community: '커뮤니티' };
  const body = {
    market: <><p className="text-gray-300 mb-4">{item.name}의 최신 시장 지수입니다.</p><Row label="현재 지수" value={item.value} /><Row label="등락" value={item.change} /></>,
    crypto: <><p className="text-gray-300 mb-4">{item.name}({item.symbol})의 가격 정보입니다.</p><Row label="현재 가격" value={item.price} /><Row label="변동률" value={item.change} /></>,
    stock: <><p className="text-gray-300 mb-4">{item.name}({item.symbol})의 종목 정보입니다.</p><Row label="현재가" value={item.price} /><Row label="변동률" value={item.change} /><p className="text-gray-400 mt-3">{item.description}</p></>,
    news: <><p className="text-gray-300 mb-4">{item.summary}</p><Row label="카테고리" value={item.category} /><Row label="시간" value={item.time} /></>,
    community: <><p className="text-gray-300 mb-4">{item.author}님의 글입니다.</p><Row label="조회" value={item.views} /><Row label="좋아요" value={item.likes} /><Row label="댓글" value={item.comments} /></>,
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4 sm:px-6">
      <div className="bg-gray-950 rounded-lg w-full max-w-3xl p-6 border border-gray-700 shadow-2xl text-white">
        <div className="flex gap-4 items-start justify-between mb-6"><div><p className="text-xs uppercase text-blue-400 mb-2">{labels[type] || '상세 정보'}</p><h2 className="text-2xl font-bold">{item.title || item.name || item.symbol}</h2></div><div className="flex gap-3">{(type === 'crypto' || type === 'stock') && <button type="button" onClick={() => toggle(favoriteKey)} className={`px-4 py-2 rounded-lg ${isFavorite ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800'}`}>{isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}</button>}<button type="button" aria-label="닫기" onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button></div></div>
        <div className="space-y-3">{body[type] || <p className="text-gray-300">상세 정보가 없습니다.</p>}</div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return <div className="flex justify-between gap-4 text-gray-300"><span>{label}</span><span className="text-white font-semibold">{value}</span></div>;
}
