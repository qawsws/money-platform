import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';

const t = {
  search: '\uAC80\uC0C9',
  placeholder: '\uC885\uBAA9 \uB610\uB294 \uB274\uC2A4 \uAC80\uC0C9',
  portfolio: '\uD3EC\uD2B8\uD3F4\uB9AC\uC624',
  favorites: '\uC990\uACA8\uCC3E\uAE30',
  mypage: '\uB9C8\uC774\uD398\uC774\uC9C0',
  admin: '\uAD00\uB9AC\uC790',
  login: '\uB85C\uADF8\uC778',
  logout: '\uB85C\uADF8\uC544\uC6C3',
  signup: '\uD68C\uC6D0\uAC00\uC785',
  market: '\uC2DC\uC7A5',
  crypto: '\uCF54\uC778',
  stocks: '\uBBF8\uAD6D\uC8FC\uC2DD',
  koreanStocks: '\uD55C\uAD6D\uC8FC\uC2DD',
  news: '\uB274\uC2A4',
  community: '\uCEE4\uBBA4\uB2C8\uD2F0',
  openMenu: '\uBA54\uB274 \uC5F4\uAE30',
  closeMenu: '\uBA54\uB274 \uB2EB\uAE30',
  userMenu: '\uC0AC\uC6A9\uC790 \uBA54\uB274',
};

const menuItems = [
  { to: '/market', label: t.market },
  { to: '/crypto', label: t.crypto },
  { to: '/stocks/us', label: t.stocks },
  { to: '/stocks/kr', label: t.koreanStocks },
  { to: '/news', label: t.news },
  { to: '/community', label: t.community },
];

const navClass = ({ isActive }) => [
  'rounded-full px-3 py-2 text-sm transition-colors',
  isActive
    ? 'bg-[var(--color-primary-soft)] font-semibold text-[var(--color-primary)]'
    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]',
].join(' ');

const avatarText = (username = '') => username.trim().charAt(0).toUpperCase() || 'M';

function Logo({ onClick }) {
  return (
    <Link to="/" onClick={onClick} className="flex shrink-0 items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-2xl bg-[var(--color-primary)] text-sm font-black text-white shadow-sm">
        M
      </span>
      <span className="text-lg font-extrabold tracking-tight text-[var(--color-text-primary)]">
        Money<span className="text-[var(--color-primary)]">Platform</span>
      </span>
    </Link>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 text-[var(--color-text-tertiary)]">
      <path d="m21 21-4.2-4.2m1.2-5.3a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`}>
      <path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function SearchBox({ input, setInput, submitSearch, className = '' }) {
  return (
    <div className={`flex h-11 min-w-0 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 shadow-sm transition focus-within:border-[var(--color-primary)] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100 ${className}`}>
      <SearchIcon />
      <input
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => event.key === 'Enter' && submitSearch()}
        placeholder={t.placeholder}
        className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
      />
      <button type="button" onClick={submitSearch} className="h-8 rounded-full bg-[var(--color-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2">
        {t.search}
      </button>
    </div>
  );
}

function AuthButtons({ onLogin, onSignup, stacked = false }) {
  return (
    <div className={`flex ${stacked ? 'w-full flex-col' : 'items-center'} gap-2`}>
      <button type="button" onClick={onLogin} className="h-10 rounded-full border border-transparent px-4 text-sm font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]">
        {t.login}
      </button>
      <button type="button" onClick={onSignup} className="h-10 rounded-full bg-[var(--color-primary)] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-primary-hover)]">
        {t.signup}
      </button>
    </div>
  );
}

function ProfileMenu({ user, logout, compact = false, hideLogoutItem = false }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const closeMenu = () => setOpen(false);
  const handleLogout = () => {
    closeMenu();
    logout();
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.userMenu}
        className="flex h-10 max-w-[180px] items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-2.5 text-sm font-semibold text-[var(--color-text-primary)] shadow-sm hover:bg-[var(--color-surface-muted)]"
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--color-primary-soft)] text-xs font-black text-[var(--color-primary)]">
          {avatarText(user?.name || user?.username)}
        </span>
        {!compact && <span className="max-w-24 truncate">{user.name || user.username}</span>}
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-1.5 shadow-[var(--shadow-card)]">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">{user.name || user.username}</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">{user.isAdmin ? t.admin : t.mypage}</p>
          </div>
          {user.isAdmin && <DropdownLink to="/admin" onClick={closeMenu}>{t.admin}</DropdownLink>}
          <DropdownLink to="/mypage" onClick={closeMenu}>{t.mypage}</DropdownLink>
          <DropdownLink to="/portfolio" onClick={closeMenu}>{t.portfolio}</DropdownLink>
          <DropdownLink to="/favorites" onClick={closeMenu}>{t.favorites}</DropdownLink>
          {!hideLogoutItem && (
            <>
              <div className="my-1 h-px bg-[var(--color-border)]" />
              <button type="button" role="menuitem" onClick={handleLogout} className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-500 hover:bg-red-50">
                {t.logout}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DropdownLink({ to, onClick, children }) {
  return (
    <Link role="menuitem" to={to} onClick={onClick} className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]">
      {children}
    </Link>
  );
}

export default function Header() {
  const { user, login, signup, logout } = useAuth();
  const { query, setQuery } = useSearch();
  const navigate = useNavigate();
  const [input, setInput] = useState(query || '');
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [loginNotice, setLoginNotice] = useState('');
  const [loginInitialUsername, setLoginInitialUsername] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const openLogin = ({ notice = '', username = '' } = {}) => {
    setLoginNotice(notice);
    setLoginInitialUsername(username);
    setShowLogin(true);
  };

  const handleSignup = async (profile) => {
    const createdUser = await signup(profile);
    setLoginInitialUsername(createdUser?.username || profile.username || '');
    setLoginNotice('\uD68C\uC6D0\uAC00\uC785\uC774 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574 \uB85C\uADF8\uC778\uD574 \uC8FC\uC138\uC694.');
    setShowLogin(true);
    return createdUser;
  };

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
  };

  const submitSearch = () => {
    setQuery(input);
    if (input.trim()) {
      navigate('/search');
      setMobileOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-white/90 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Logo onClick={() => setMobileOpen(false)} />

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {menuItems.map((item) => <NavLink key={item.to} to={item.to} className={navClass}>{item.label}</NavLink>)}
        </nav>

        <SearchBox input={input} setInput={setInput} submitSearch={submitSearch} className="ml-auto hidden max-w-sm flex-1 md:flex xl:max-w-md" />

        <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex">
          {user ? (
            <>
              <ProfileMenu user={user} logout={handleLogout} hideLogoutItem />
              <button type="button" onClick={handleLogout} className="h-10 rounded-full border border-red-100 bg-red-50 px-4 text-sm font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-100">
                {t.logout}
              </button>
            </>
          ) : (
            <AuthButtons onLogin={() => openLogin()} onSignup={() => setShowSignup(true)} />
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          {user && <ProfileMenu user={user} logout={handleLogout} compact />}
          <button
            type="button"
            aria-label={mobileOpen ? t.closeMenu : t.openMenu}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
            className="grid size-10 place-items-center rounded-full border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] shadow-sm hover:bg-[var(--color-surface-muted)]"
          >
            <span className="relative block h-3.5 w-4">
              <span className={`absolute left-0 top-0 h-0.5 w-4 rounded-full bg-current transition ${mobileOpen ? 'translate-y-1.5 rotate-45' : ''}`} />
              <span className={`absolute left-0 top-1.5 h-0.5 w-4 rounded-full bg-current transition ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`absolute left-0 top-3 h-0.5 w-4 rounded-full bg-current transition ${mobileOpen ? '-translate-y-1.5 -rotate-45' : ''}`} />
            </span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[var(--color-border)] bg-white px-4 py-4 shadow-sm md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-4">
            <SearchBox input={input} setInput={setInput} submitSearch={submitSearch} className="w-full" />
            <nav aria-label="Mobile primary" className="grid grid-cols-2 gap-2">
              {menuItems.map((item) => (
                <NavLink key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className={navClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            {user ? (
              <button type="button" onClick={handleLogout} className="h-11 w-full rounded-full border border-red-100 bg-red-50 px-4 text-sm font-semibold text-red-600 hover:bg-red-100">
                {t.logout}
              </button>
            ) : (
              <AuthButtons stacked onLogin={() => { openLogin(); setMobileOpen(false); }} onSignup={() => { setShowSignup(true); setMobileOpen(false); }} />
            )}
          </div>
        </div>
      )}

      {showLogin && <LoginModal open={showLogin} onClose={() => setShowLogin(false)} onLogin={({ username, password }) => login(username, password)} initialUsername={loginInitialUsername} notice={loginNotice} />}
      <SignupModal open={showSignup} onClose={() => setShowSignup(false)} onSignup={handleSignup} />
    </header>
  );
}
