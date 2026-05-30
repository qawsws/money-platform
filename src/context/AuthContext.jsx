/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { postLogin, postSignup } from '../services/api';
import { useFavoritesStore } from '../store/favoritesStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('mp_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const setFavoritesUser = useFavoritesStore((state) => state.setUser);

  useEffect(() => {
    setFavoritesUser(user?.username || null);
  }, [user, setFavoritesUser]);

  const remember = (res) => {
    setUser(res.user);
    localStorage.setItem('mp_user', JSON.stringify(res.user));
    localStorage.setItem('mp_token', res.token || '');
    return res.user;
  };

  async function login(username, password) {
    const res = await postLogin({ username, password });
    if (!res?.success) throw new Error('\uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
    return remember(res);
  }

  async function signup(profile) {
    const res = await postSignup(profile);
    if (!res?.success) throw new Error('\uD68C\uC6D0\uAC00\uC785\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
    return remember(res);
  }

  function logout() {
    setUser(null);
    localStorage.removeItem('mp_user');
    localStorage.removeItem('mp_token');
  }

  return <AuthContext.Provider value={{ user, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
