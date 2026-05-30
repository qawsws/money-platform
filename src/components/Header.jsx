import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';

const text = {
  menu: '\uBA54\uB274',
  searchPlaceholder: '\uC885\uBAA9 \uB610\uB294 \uB274\uC2A4 \uAC80\uC0C9',
  search: '\uAC80\uC0C9',
  portfolio: '\uD3EC\uD2B8\uD3F4\uB9AC\uC624',
  favorites: '\uC990\uACA8\uCC3E\uAE30',
  login: '\uB85C\uADF8\uC778',
  logout: '\uB85C\uADF8\uC544\uC6C3',
  signup: '\uD68C\uC6D0\uAC00\uC785',
  market: '\uC2DC\uC7A5',
  news: '\uB274\uC2A4',
  community: '\uCEE4\uBBA4\uB2C8\uD2F0',
};

export default function Header() {
  const { user, login, signup, logout } = useAuth();
  const { query, setQuery } = useSearch();
  const [input, setInput] = useState(query || '');
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xl font-bold text-white">MoneyPlatform</Link>
            <button type="button" aria-label={text.menu} onClick={() => setShowMobileNav((prev) => !prev)} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-300 md:hidden">{text.menu}</button>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto md:flex-row md:items-center md:space-x-4">
            <div className="flex w-full md:w-auto">
              <input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && setQuery(input)} placeholder={text.searchPlaceholder} className="w-full md:w-64 px-3 py-2 rounded-l-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none" />
              <button type="button" onClick={() => setQuery(input)} className="hidden md:inline-flex items-center px-4 py-2 rounded-r-lg bg-blue-600 hover:bg-blue-700 text-white">{text.search}</button>
            </div>
            {user ? (
              <div className="flex flex-wrap items-center gap-3 justify-end"><span className="text-gray-300">{user.username}</span><Link to="/portfolio" className="text-gray-300 hover:text-white">{text.portfolio}</Link><Link to="/favorites" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{text.favorites}</Link><button type="button" onClick={logout} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg">{text.logout}</button></div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 justify-end"><button type="button" onClick={() => setShowLogin(true)} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium">{text.login}</button><button type="button" onClick={() => setShowSignup(true)} className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300">{text.signup}</button></div>
            )}
          </div>
        </div>
        {showMobileNav && <nav className="flex flex-col gap-2 pb-4 md:hidden"><a href="#market" className="text-gray-300">{text.market}</a><a href="#news" className="text-gray-300">{text.news}</a><a href="#community" className="text-gray-300">{text.community}</a>{user && <Link to="/favorites" className="text-gray-300">{text.favorites}</Link>}</nav>}
      </div>
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} onLogin={({ username, password }) => login(username, password)} />
      <SignupModal open={showSignup} onClose={() => setShowSignup(false)} onSignup={signup} />
    </header>
  );
}
