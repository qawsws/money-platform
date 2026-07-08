import { create } from 'zustand';
import { getFavorites, postFavoriteToggle } from '../services/api';

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
    // Keep the in-memory state when storage is unavailable.
  }
}

const userKey = (username) => username ? `user:${username}` : 'guest';

export const useFavoritesStore = create((set, get) => ({
  activeUser: 'guest',
  token: '',
  favorites: readStorage().guest || [],
  setUser: async (username, token = '') => {
    const activeUser = userKey(username);
    const cached = readStorage()[activeUser] || [];
    set({ activeUser, token, favorites: cached });
    if (!username || !token) return;
    try {
      const res = await getFavorites(token);
      set({ favorites: res.favorites || [] });
    } catch {
      set({ favorites: cached });
    }
  },
  toggle: async (id) => {
    const { activeUser, favorites, token } = get();
    const next = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id];
    set({ favorites: next });

    if (token) {
      try {
        const res = await postFavoriteToggle(token, id);
        set({ favorites: res.favorites || next });
        return;
      } catch {
        set({ favorites });
        return;
      }
    }

    const data = readStorage();
    data[activeUser] = next;
    writeStorage(data);
  },
}));
