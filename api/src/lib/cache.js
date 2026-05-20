import Redis from 'ioredis'

// TTLs in seconds
export const TTL = {
  STRAPI: 300, // 5 min — Strapi content (packages, events, services)
  ADMIN: 300, // 5 min — admin access resolution per user
  DASHBOARD: 60, // 1 min — dashboard summary counts
  PROFILE: 120, // 2 min — user profile data
}

let client = null

export function getRedis() {
  if (client) return client

  const url = process.env.REDIS_URL || 'redis://localhost:6379'

  client = new Redis(url, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    lazyConnect: true,
  })

  client.on('connect', () => console.log('[cache] Redis connected'))
  client.on('error', err => console.warn('[cache] Redis error:', err.message))

  return client
}

export async function connectRedis() {
  try {
    await getRedis().connect()
  } catch (err) {
    console.warn('[cache] Redis connect failed — caching disabled:', err.message)
  }
}

export async function disconnectRedis() {
  if (client) {
    await client.quit().catch(() => {})
    client = null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export async function cacheGet(key) {
  try {
    const raw = await getRedis().get(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function cacheSet(key, value, ttlSeconds) {
  try {
    await getRedis().set(key, JSON.stringify(value), 'EX', ttlSeconds)
  } catch {
    // silently skip — app works without cache
  }
}

export async function cacheDel(...keys) {
  try {
    if (keys.length) await getRedis().del(...keys)
  } catch {
    // ignore
  }
}

export async function cacheDelPattern(pattern) {
  try {
    const keys = await getRedis().keys(pattern)
    if (keys.length) await getRedis().del(...keys)
  } catch {
    // ignore
  }
}

// ─── Wrap any async fn with cache-aside logic ─────────────────────────────────
export async function withCache(key, ttlSeconds, fn) {
  const cached = await cacheGet(key)
  if (cached !== null) return cached

  const result = await fn()
  await cacheSet(key, result, ttlSeconds)
  return result
}
