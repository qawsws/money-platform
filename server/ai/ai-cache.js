import { createHash } from 'node:crypto';
import { AiError, AI_MESSAGES } from './ai-errors.js';

const ttl = Number(process.env.AI_CACHE_TTL_MS || (Number(process.env.AI_CACHE_TTL_SECONDS || 600) * 1000));
const maxEntries = Number(process.env.AI_CACHE_MAX_ENTRIES || 200);
const cache = new Map();

function stableStringify(value, seen = new WeakSet()) {
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item, seen)).join(',')}]`;
  if (value && typeof value === 'object') {
    if (seen.has(value)) throw new AiError('INVALID_CACHE_PAYLOAD', AI_MESSAGES.invalidInput, 400);
    seen.add(value);
    const result = `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key], seen)}`).join(',')}}`;
    seen.delete(value);
    return result;
  }
  return JSON.stringify(value);
}

function pruneExpired() {
  const now = Date.now();
  for (const [key, hit] of cache) {
    if (now - hit.time > ttl) cache.delete(key);
  }
}

function pruneOldest() {
  while (cache.size > maxEntries) {
    const oldestKey = cache.keys().next().value;
    if (!oldestKey) return;
    cache.delete(oldestKey);
  }
}

export function hashPayload(payload) {
  return createHash('sha256').update(stableStringify(payload)).digest('hex');
}

export function readAiCache(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.time > ttl) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

export function writeAiCache(key, value) {
  pruneExpired();
  cache.set(key, { time: Date.now(), value });
  pruneOldest();
}
