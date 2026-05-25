import { create } from 'zustand'

const KEY = 'mp_favorites'

function readStorage() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeStorage(arr) {
  try {
    localStorage.setItem(KEY, JSON.stringify(arr))
  } catch {}
}

export const useFavoritesStore = create((set, get) => ({
  // favorites stored as array of ids for compatibility with existing helpers
  favorites: typeof window !== 'undefined' ? readStorage() : [],
  add: (id) => set((s) => { const next = Array.from(new Set([...s.favorites, id])); writeStorage(next); return { favorites: next } }),
  remove: (id) => set((s) => { const next = s.favorites.filter((i) => i !== id); writeStorage(next); return { favorites: next } }),
  toggle: (id) => set((s) => {
    const exists = s.favorites.includes(id)
    const next = exists ? s.favorites.filter((i) => i !== id) : [...s.favorites, id]
    writeStorage(next)
    return { favorites: next }
  }),
}))
