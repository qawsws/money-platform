// Header component - top navigation bar
// Renders logo, menu and user actions

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import LoginModal from './LoginModal';

export default function Header() {
  const { user, login, logout } = useAuth();
  const { query, setQuery } = useSearch();
  const [input, setInput] = useState(query || '');
  const [showLogin, setShowLogin] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  const handleOpenLogin = () => setShowLogin(true);
  const handleCloseLogin = () => setShowLogin(false);
  const handleToggleNav = () => setShowMobileNav((prev) => !prev);

  const handleLogin = async ({ username, password }) => {
    await login(username, password);
  };

  const handleSearch = () => {
    setQuery(input);
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">💰</span>
              <span className="text-xl font-bold text-white">MoneyPlatform</span>
            </div>
            <button
              type="button"
              onClick={handleToggleNav}
              className="inline-flex items-center justify-center rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-300 md:hidden"
            >
              Menu
            </button>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto md:flex-row md:items-center md:space-x-4">
            <div className="flex w-full md:w-auto">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search stocks or news"
                className="w-full md:w-64 px-3 py-2 rounded-l-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSearch}
                className="hidden md:inline-flex items-center px-4 py-2 rounded-r-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                Search
              </button>
            </div>

            {user ? (
              <div className="flex flex-wrap items-center gap-3 justify-end">
                <span className="text-gray-300">{user.username}</span>
                <button onClick={logout} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg">Logout</button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 justify-end">
                <button onClick={handleOpenLogin} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium">Login</button>
                <button className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300">Sign up</button>
              </div>
            )}
          </div>
        </div>

        {showMobileNav && (
          <nav className="flex flex-col gap-2 pb-4 md:hidden">
            <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">Market</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">News</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">Community</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">Portfolio</a>
          </nav>
        )}
      </div>

      <LoginModal open={showLogin} onClose={handleCloseLogin} onLogin={handleLogin} />
    </header>
  );
}
