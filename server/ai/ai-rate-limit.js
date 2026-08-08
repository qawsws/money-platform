import { AiError, AI_MESSAGES } from './ai-errors.js';

const windowMs = Number(process.env.AI_RATE_LIMIT_WINDOW_MS || 60_000);
const maxRequests = Number(process.env.AI_RATE_LIMIT_MAX || 8);
const maxDailyCalls = Number(process.env.AI_MAX_OPENAI_CALLS_PER_DAY || 5);
const maxDailyCallsPerUser = Number(process.env.AI_MAX_OPENAI_CALLS_PER_USER_PER_DAY || 2);
const buckets = new Map();
const dailyCalls = new Map();

function pruneBuckets(now) {
  for (const [key, bucket] of buckets) {
    if (now - bucket.startedAt > windowMs) buckets.delete(key);
  }
}

function dayKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function assertAiRateLimit(key = 'anonymous') {
  const now = Date.now();
  pruneBuckets(now);
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.startedAt > windowMs) {
    buckets.set(key, { startedAt: now, count: 1 });
    return;
  }

  if (bucket.count >= maxRequests) {
    throw new AiError('RATE_LIMIT', AI_MESSAGES.rateLimit, 429);
  }

  bucket.count += 1;
}

export function reserveOpenAiCallBudget(userKey = 'anonymous') {
  const today = dayKey();
  const serverKey = `server:${today}`;
  const userDayKey = `user:${userKey}:${today}`;
  const serverCount = dailyCalls.get(serverKey) || 0;
  const userCount = dailyCalls.get(userDayKey) || 0;

  if (serverCount >= maxDailyCalls) {
    throw new AiError('AI_DAILY_LIMIT_REACHED', AI_MESSAGES.dailyLimit, 429);
  }
  if (userCount >= maxDailyCallsPerUser) {
    throw new AiError('AI_DAILY_LIMIT_REACHED', AI_MESSAGES.dailyLimit, 429);
  }

  dailyCalls.set(serverKey, serverCount + 1);
  dailyCalls.set(userDayKey, userCount + 1);
}
