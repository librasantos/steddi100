// api/_kv.js — Compatibility shim for @vercel/kv using @upstash/redis
// DIAGNOSTIC VERSION — throws errors loudly so they surface in API responses

import { Redis } from '@upstash/redis';

// Capture which env vars were present at module load time.
const ENV_DIAG = {
  has_KV_URL: !!process.env.KV_URL,
  has_KV_REST_API_URL: !!process.env.KV_REST_API_URL,
  has_KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
  has_KV_REST_API_READ_ONLY_TOKEN: !!process.env.KV_REST_API_READ_ONLY_TOKEN,
  has_KV_REDIS_URL: !!process.env.KV_REDIS_URL,
  has_UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
  has_UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
  has_REDIS_URL: !!process.env.REDIS_URL,
  KV_URL_prefix: (process.env.KV_URL || '').slice(0, 10),
  KV_REST_API_URL_prefix: (process.env.KV_REST_API_URL || '').slice(0, 10),
};

export const kvDiag = ENV_DIAG;

let _client = null;
let _clientInitError = null;

function getClient() {
  if (_client) return _client;
  if (_clientInitError) throw _clientInitError;

  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      _client = new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      });
      return _client;
    }
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      _client = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      return _client;
    }
    _client = Redis.fromEnv();
    return _client;
  } catch (err) {
    _clientInitError = new Error(
      `[_kv] Client init failed: ${err?.message || 'unknown'}. Env: ${JSON.stringify(ENV_DIAG)}`
    );
    throw _clientInitError;
  }
}

export const kv = {
  async get(key) {
    const client = getClient();
    try {
      return await client.get(key);
    } catch (err) {
      throw new Error(`[_kv] get(${key}) failed: ${err?.message || 'unknown'}`);
    }
  },

  async set(key, value, options) {
    const client = getClient();
    try {
      if (options && typeof options === 'object' && options.ex) {
        return await client.set(key, value, { ex: options.ex });
      }
      return await client.set(key, value);
    } catch (err) {
      throw new Error(`[_kv] set(${key}) failed: ${err?.message || 'unknown'}`);
    }
  },

  async incr(key) {
    const client = getClient();
    try {
      return await client.incr(key);
    } catch (err) {
      throw new Error(`[_kv] incr(${key}) failed: ${err?.message || 'unknown'}`);
    }
  },

  async expire(key, seconds) {
    const client = getClient();
    try {
      return await client.expire(key, seconds);
    } catch (err) {
      throw new Error(`[_kv] expire(${key}) failed: ${err?.message || 'unknown'}`);
    }
  },

  async del(key) {
    const client = getClient();
    try {
      return await client.del(key);
    } catch (err) {
      throw new Error(`[_kv] del(${key}) failed: ${err?.message || 'unknown'}`);
    }
  },
};
