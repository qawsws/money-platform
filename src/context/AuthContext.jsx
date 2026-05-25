/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext } from 'react';
import { postLogin } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('mp_user');
    return raw ? JSON.parse(raw) : null;
  });

  async function login(username, password) {
    // postLogin을 시도하여 서버 인증을 우선 수행합니다.
    try {
      const res = await postLogin({ username, password });
      // res: { success: true, user, token }
      if (res && res.success) {
        const u = res.user;
        setUser(u);
        localStorage.setItem('mp_user', JSON.stringify(u));
        localStorage.setItem('mp_token', res.token || '');
        return u;
      }
      throw new Error(res?.message || '로그인 실패');
    } catch (error) {
      // 서버 인증 실패 시도 대신 클라이언트 로컬 로그인 (개발 편의)
      console.error(error);
      const u = { username };
      setUser(u);
      localStorage.setItem('mp_user', JSON.stringify(u));
      return u;
    }
  }

  function logout() {
    setUser(null);
    localStorage.removeItem('mp_user');
    localStorage.removeItem('mp_token');
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
