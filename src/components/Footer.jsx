import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-14 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-7 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div><Link to="/" className="font-bold text-slate-800">MoneyPlatform</Link><p className="mt-1">{'\uD22C\uC790 \uC815\uBCF4\uB97C \uD55C\uACF3\uC5D0\uC11C \uAC04\uD3B8\uD558\uAC8C \uD655\uC778\uD558\uC138\uC694.'}</p></div>
        <p>&copy; 2026 MoneyPlatform. {'\uAD50\uC721\uC6A9 \uD22C\uC790 \uC815\uBCF4 \uC11C\uBE44\uC2A4\uC785\uB2C8\uB2E4.'}</p>
      </div>
    </footer>
  );
}
