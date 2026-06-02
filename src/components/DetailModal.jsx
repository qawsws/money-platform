import { useFavoritesStore } from '../store/favoritesStore';

const t = {
  market: '\uC2DC\uC7A5 \uC9C0\uC218', crypto: '\uC554\uD638\uD654\uD3D0', stock: '\uBBF8\uAD6D \uC8FC\uC2DD', news: '\uB274\uC2A4', community: '\uCEE4\uBBA4\uB2C8\uD2F0',
  detail: '\uC0C1\uC138 \uC815\uBCF4', favorite: '\uC990\uACA8\uCC3E\uAE30', remove: '\uC990\uACA8\uCC3E\uAE30 \uD574\uC81C', close: '\uB2EB\uAE30',
};
const Row = ({ label, value }) => <div className="flex justify-between gap-4 border-b border-slate-100 py-3 text-sm"><span className="text-slate-500">{label}</span><b>{value}</b></div>;

export default function DetailModal({ open, type, item, onClose }) {
  const favorites = useFavoritesStore((state) => state.favorites);
  const toggle = useFavoritesStore((state) => state.toggle);
  if (!open || !item) return null;
  const key = `${type}:${item.id ?? item.symbol ?? item.title}`;
  const selected = favorites.includes(key);
  const rows = type === 'market' ? [['\uD604\uC7AC \uC9C0\uC218', item.value], ['\uB4F1\uB77D', item.change]] : type === 'crypto' || type === 'stock' ? [['\uD604\uC7AC\uAC00', item.price], ['\uBCC0\uB3D9\uB960', item.change]] : type === 'news' ? [['\uCE74\uD14C\uACE0\uB9AC', item.category], ['\uC2DC\uAC04', item.time]] : [['\uC870\uD68C', item.views], ['\uC88B\uC544\uC694', item.likes], ['\uB313\uAE00', item.comments]];
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4"><div className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold text-blue-600">{t[type] || t.detail}</p><h2 className="mt-2 text-xl font-bold text-slate-950">{item.title || item.name || item.symbol}</h2></div><button type="button" aria-label={t.close} onClick={onClose} className="text-xl text-slate-400 hover:text-slate-800">\u00d7</button></div>{item.summary && <p className="mt-4 text-sm leading-6 text-slate-600">{item.summary}</p>}{item.description && <p className="mt-4 text-sm text-slate-600">{item.description}</p>}<div className="mt-5 border-t border-slate-200">{rows.map(([label, value]) => <Row key={label} label={label} value={value} />)}</div>{(type === 'crypto' || type === 'stock') && <button type="button" onClick={() => toggle(key)} className={`mt-5 w-full rounded-md px-4 py-3 text-sm font-bold ${selected ? 'border border-slate-300 bg-white text-slate-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>{selected ? t.remove : t.favorite}</button>}</div></div>;
}
