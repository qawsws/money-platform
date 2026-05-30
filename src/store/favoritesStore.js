import { create } from 'zustand';

const KEY = 'mp_favorites';

function readStorage() {
  try {
    const raw = localStorage.getItem(KEY);
    const value = raw ? JSON.parse(raw) : {};
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
    return { guest: Array.isArray(value) ? value : [] };
  } catch {
    return { guest: [] };
  }
}

function writeStorage(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // 즐겨찾기는 저장 공간이 차단된 환경에서도 메모리 상태로 동작합니다.
  }
}

const userKey = (username) => username ? `user:${username}` : 'guest';

export const useFavoritesStore = create((set, get) => ({
  activeUser: 'guest',
  favorites: readStorage().guest || [],
  setUser: (username) => {
    const activeUser = userKey(username);
    set({ activeUser, favorites: readStorage()[activeUser] || [] });
  },
  toggle: (id) => {
    const { activeUser, favorites } = get();
    const next = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id];
    const data = readStorage();
    data[activeUser] = next;
    writeStorage(data);
    set({ favorites: next });
  },
}));
