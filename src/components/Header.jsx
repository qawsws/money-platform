import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';

const t = {
  search: '\uAC80\uC0C9',
  placeholder: '\uC885\uBAA9 \uB610\uB294 \uB274\uC2A4 \uAC80\uC0C9',
  portfolio: '\uD3EC\uD2B8\uD3F4\uB9AC\uC624',
  favorites: '\uC990\uACA8\uCC3E\uAE30',
  login: '\uB85C\uADF8\uC778',
  logout: '\uB85C\uADF8\uC544\uC6C3',
  signup: '\uD68C\uC6D0\uAC00\uC785',
  market: '\uC2DC\uC7A5',
  crypto: '\uCF54\uC778',
  stocks: '\uBBF8\uAD6D\uC8FC\uC2DD',
  news: '\uB274\uC2A4',
  community: '\uCEE4\uBBA4\uB2C8\uD2F0',
};

export default function Header() {
  const { user, login, signup, logout } = useAuth();
  const { query, setQuery } = useSearch();
  const [input, setInput] = useState(query || '');
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const submitSearch = () => setQuery(input);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="shrink-0 text-lg font-extrabold text-slate-950">Money<span className="text-blue-600">Platform</span></Link>
        <div className="order-last flex w-full items-center md:order-none md:max-w-md md:flex-1">
          <input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submitSearch()} placeholder={t.placeholder} className="h-10 w-full rounded-l-md border border-slate-300 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500 focus:bg-white" />
          <button type="button" onClick={submitSearch} className="h-10 rounded-r-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">{t.search}</button>
        </div>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {user ? <><span className="hidden text-slate-500 sm:inline">{user.username}</span><Link to="/portfolio" className="text-slate-600 hover:text-slate-950">{t.portfolio}</Link><Link to="/favorites" className="text-slate-600 hover:text-slate-950">{t.favorites}</Link><button type="button" onClick={logout} className="rounded-md border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50">{t.logout}</button></> : <><button type="button" onClick={() => setShowLogin(true)} className="text-slate-700 hover:text-slate-950">{t.login}</button><button type="button" onClick={() => setShowSignup(true)} className="rounded-md bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700">{t.signup}</button></>}
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl gap-5 overflow-x-auto px-4 pb-3 text-sm text-slate-600 sm:px-6 lg:px-8">
        <a href="#market" className="whitespace-nowrap hover:text-blue-600">{t.market}</a><a href="#crypto" className="whitespace-nowrap hover:text-blue-600">{t.crypto}</a><a href="#stocks" className="whitespace-nowrap hover:text-blue-600">{t.stocks}</a><a href="#news" className="whitespace-nowrap hover:text-blue-600">{t.news}</a><a href="#community" className="whitespace-nowrap hover:text-blue-600">{t.community}</a>
      </div>
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} onLogin={({ username, password }) => login(username, password)} />
      <SignupModal open={showSignup} onClose={() => setShowSignup(false)} onSignup={signup} />
    </header>
  );
}
