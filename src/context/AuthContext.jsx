/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, postLogin, postSignup } from '../services/api';
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
    setFavoritesUser(user?.username || null, localStorage.getItem('mp_token') || '');
  }, [user, setFavoritesUser]);

  useEffect(() => {
    const token = localStorage.getItem('mp_token');
    if (!token) return;
    getCurrentUser(token).then((res) => setUser(res.user)).catch(() => {
      setUser(null);
      localStorage.removeItem('mp_user');
      localStorage.removeItem('mp_token');
    });
  }, []);

  const remember = (res) => {
    setUser(res.user);
    localStorage.setItem('mp_user', JSON.stringify(res.user));
    localStorage.setItem('mp_token', res.token || '');
    return res.user;
  };

  const replaceSession = (res) => remember(res);

  async function refreshUser() {
    const token = localStorage.getItem('mp_token');
    if (!token) return null;
    const res = await getCurrentUser(token);
    setUser(res.user);
    localStorage.setItem('mp_user', JSON.stringify(res.user));
    return res.user;
  }

  async function login(username, password) {
    const res = await postLogin({ username, password });
    if (!res?.success) throw new Error('로그인에 실패했습니다.');
    return remember(res);
  }

  async function signup(profile) {
    const res = await postSignup(profile);
    if (!res?.success) throw new Error('회원가입에 실패했습니다.');
    return res.user;
  }

  function logout() {
    setUser(null);
    localStorage.removeItem('mp_user');
    localStorage.removeItem('mp_token');
  }

  return <AuthContext.Provider value={{ user, login, signup, logout, refreshUser, replaceSession }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
