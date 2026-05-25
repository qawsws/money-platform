const KEY = 'mp_favorites';

export function getFavorites() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isFavorite(id) {
  const fav = getFavorites();
  return fav.includes(id);
}

export function toggleFavorite(id) {
  const fav = getFavorites();
  const set = new Set(fav);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  const arr = Array.from(set);
  localStorage.setItem(KEY, JSON.stringify(arr));
  return arr;
}
