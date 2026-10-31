// Offline Storage & Local Persistence Service
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  AUTH_TOKEN: '@supportdesk:auth_token',
  AUTH_REFRESH_TOKEN: '@supportdesk:auth_refresh_token',
  AUTH_USER: '@supportdesk:auth_user',
  TICKETS_CACHE: '@supportdesk:tickets_cache',
  KB_ARTICLES_CACHE: '@supportdesk:kb_articles_cache',
  OFFLINE_MUTATION_QUEUE: '@supportdesk:offline_mutation_queue',
};

// In-memory fallback if AsyncStorage fails or runs in a restricted context
const memoryStore = new Map();

async function safeGetItem(key) {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : (memoryStore.get(key) || null);
  } catch (err) {
    console.warn(`[OfflineStorage] Failed to read ${key}:`, err);
    return memoryStore.get(key) || null;
  }
}

async function safeSetItem(key, value) {
  try {
    memoryStore.set(key, value);
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[OfflineStorage] Failed to write ${key}:`, err);
  }
}

async function safeRemoveItem(key) {
  try {
    memoryStore.delete(key);
    await AsyncStorage.removeItem(key);
  } catch (err) {
    console.warn(`[OfflineStorage] Failed to delete ${key}:`, err);
  }
}

export const offlineStorage = {
  // Authentication persistence
  async saveAuth(token, user, refreshToken = null) {
    await safeSetItem(STORAGE_KEYS.AUTH_TOKEN, token);
    await safeSetItem(STORAGE_KEYS.AUTH_USER, user);
    if (refreshToken) {
      await safeSetItem(STORAGE_KEYS.AUTH_REFRESH_TOKEN, refreshToken);
    }
  },

  async getStoredAuth() {
    const token = await safeGetItem(STORAGE_KEYS.AUTH_TOKEN);
    const user = await safeGetItem(STORAGE_KEYS.AUTH_USER);
    const refreshToken = await safeGetItem(STORAGE_KEYS.AUTH_REFRESH_TOKEN);
    return { token, user, refreshToken };
  },

  async clearAuth() {
    await safeRemoveItem(STORAGE_KEYS.AUTH_TOKEN);
    await safeRemoveItem(STORAGE_KEYS.AUTH_USER);
    await safeRemoveItem(STORAGE_KEYS.AUTH_REFRESH_TOKEN);
  },

  // Tickets local cache
  async cacheTickets(tickets) {
    await safeSetItem(STORAGE_KEYS.TICKETS_CACHE, tickets);
  },

  async getCachedTickets() {
    return await safeGetItem(STORAGE_KEYS.TICKETS_CACHE);
  },

  // Knowledge base cache
  async cacheArticles(articles) {
    await safeSetItem(STORAGE_KEYS.KB_ARTICLES_CACHE, articles);
  },

  async getCachedArticles() {
    return await safeGetItem(STORAGE_KEYS.KB_ARTICLES_CACHE);
  },

  // Offline mutation queue
  async getQueue() {
    const queue = await safeGetItem(STORAGE_KEYS.OFFLINE_MUTATION_QUEUE);
    return Array.isArray(queue) ? queue : [];
  },

  async enqueueMutation(type, payload) {
    const queue = await this.getQueue();
    const mutation = {
      id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type, // 'CREATE_TICKET' | 'ADD_MESSAGE' | 'UPDATE_STATUS'
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };
    queue.push(mutation);
    await safeSetItem(STORAGE_KEYS.OFFLINE_MUTATION_QUEUE, queue);
    return mutation;
  },

  async removeMutation(mutationId) {
    const queue = await this.getQueue();
    const filtered = queue.filter((item) => item.id !== mutationId);
    await safeSetItem(STORAGE_KEYS.OFFLINE_MUTATION_QUEUE, filtered);
  },

  async clearQueue() {
    await safeSetItem(STORAGE_KEYS.OFFLINE_MUTATION_QUEUE, []);
  },
};

