/**
 * Context Cache Service — Pattern từ upstash/context7 MCP
 * 
 * Cho phép AI Chatbot và các component khác lưu trữ context
 * bền vững giữa các phiên làm việc (session persistence)
 * 
 * Cache layers:
 *   Level 1: In-memory (nhanh nhất)
 *   Level 2: localStorage (persist qua page refresh)
 *   Level 3: Server-side Redis (nếu có backend)
 */

const CONTEXT_PREFIX = 'ctx7_';
const DEFAULT_TTL = 30 * 60 * 1000; // 30 phút
const MAX_CONTEXT_SIZE = 50; // Số messages tối đa trong 1 context

// ===== Level 1: In-Memory Cache =====
class MemoryStore {
  constructor() {
    this._store = new Map();
    this._timers = new Map();
  }

  get(key) {
    const entry = this._store.get(key);
    if (!entry) return null;
    if (entry.expiry && Date.now() > entry.expiry) {
      this._store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttl = DEFAULT_TTL) {
    // Clear old timer if exists
    if (this._timers.has(key)) {
      clearTimeout(this._timers.get(key));
    }

    this._store.set(key, {
      value,
      expiry: ttl ? Date.now() + ttl : null
    });

    // Auto-expire
    if (ttl) {
      const timer = setTimeout(() => {
        this._store.delete(key);
        this._timers.delete(key);
      }, ttl);
      this._timers.set(key, timer);
    }
  }

  delete(key) {
    this._store.delete(key);
    if (this._timers.has(key)) {
      clearTimeout(this._timers.get(key));
      this._timers.delete(key);
    }
  }

  clear(namespace) {
    if (!namespace) {
      this._store.clear();
      this._timers.forEach(t => clearTimeout(t));
      this._timers.clear();
      return;
    }
    for (const key of this._store.keys()) {
      if (key.startsWith(namespace)) {
        this.delete(key);
      }
    }
  }

  get size() {
    return this._store.size;
  }
}

// ===== Singleton memory store =====
const memoryStore = new MemoryStore();

// ===== Level 2: localStorage (browser only) =====
function getLocalStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

// ===== Level 3: Server-side API (optional) =====
async function fetchServerContext(key, value = null, operation = 'get') {
  try {
    const apiUrl = process.env.VITE_API_URL || '';
    if (!apiUrl) return null;

    if (operation === 'get') {
      const res = await fetch(`${apiUrl}/api/context?key=${encodeURIComponent(key)}`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        return data.value;
      }
    } else if (operation === 'set' && value !== null) {
      await fetch(`${apiUrl}/api/context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key, value })
      });
    }
    return null;
  } catch {
    return null; // Silent fail — fallback to local cache
  }
}

// ===== Public API =====

/**
 * Lưu context message
 * @param {string} sessionId - ID phiên chat
 * @param {string} role - 'user' | 'assistant' | 'system'
 * @param {string} content - Nội dung message
 */
export async function addContextMessage(sessionId, role, content) {
  const key = `${CONTEXT_PREFIX}chat_${sessionId}`;
  
  // In-memory
  let messages = memoryStore.get(key) || [];
  messages.push({ role, content, timestamp: new Date().toISOString() });
  
  // Giới hạn kích thước
  if (messages.length > MAX_CONTEXT_SIZE) {
    messages = messages.slice(-MAX_CONTEXT_SIZE);
  }
  
  memoryStore.set(key, messages, DEFAULT_TTL);
  
  // localStorage
  const ls = getLocalStorage();
  if (ls) {
    try {
      ls.setItem(key, JSON.stringify(messages));
    } catch { /* quota exceeded */ }
  }

  // Server-side (nếu có backend Redis)
  await fetchServerContext(key, messages, 'set');
  
  return messages;
}

/**
 * Lấy toàn bộ context messages
 * @param {string} sessionId
 * @returns {Promise<Array>}
 */
export async function getContextMessages(sessionId) {
  const key = `${CONTEXT_PREFIX}chat_${sessionId}`;
  
  // Level 1: In-memory
  let messages = memoryStore.get(key);
  if (messages) return messages;
  
  // Level 2: localStorage
  const ls = getLocalStorage();
  if (ls) {
    try {
      const stored = ls.getItem(key);
      if (stored) {
        messages = JSON.parse(stored);
        memoryStore.set(key, messages, DEFAULT_TTL);
        return messages;
      }
    } catch { /* ignore */ }
  }
  
  // Level 3: Server-side
  messages = await fetchServerContext(key);
  if (messages) {
    memoryStore.set(key, messages, DEFAULT_TTL);
    return messages;
  }
  
  return [];
}

/**
 * Xoá context cho một session
 * @param {string} sessionId
 */
export function clearContext(sessionId) {
  const key = `${CONTEXT_PREFIX}chat_${sessionId}`;
  memoryStore.delete(key);
  
  const ls = getLocalStorage();
  if (ls) ls.removeItem(key);
}

/**
 * Xoá tất cả context (khi logout)
 * @param {string} [namespace] - Nếu có, chỉ xoá theo namespace
 */
export function clearAllContext(namespace) {
  if (namespace) {
    memoryStore.clear(`${CONTEXT_PREFIX}${namespace}`);
    const ls = getLocalStorage();
    if (ls) {
      Object.keys(ls).forEach(k => {
        if (k.startsWith(`${CONTEXT_PREFIX}${namespace}`)) {
          ls.removeItem(k);
        }
      });
    }
  } else {
    memoryStore.clear();
    const ls = getLocalStorage();
    if (ls) {
      Object.keys(ls).forEach(k => {
        if (k.startsWith(CONTEXT_PREFIX)) {
          ls.removeItem(k);
        }
      });
    }
  }
}

/**
 * Kiểm tra tình trạng cache
 */
export function getCacheStats() {
  return {
    memorySize: memoryStore.size,
    memoryKeys: [...memoryStore._store.keys()].filter(k => k.startsWith(CONTEXT_PREFIX)),
    localStorageAvailable: !!getLocalStorage()
  };
}

// ===== Compatibility wrappers for AIChatWidget (Context7 pattern) =====

/**
 * Save context with userId + sessionId (compatible with server API)
 */
export async function saveContext(userId, sessionId, contextData) {
  const compositeKey = `${userId}_${sessionId}`;
  if (contextData?.messages) {
    const key = `${CONTEXT_PREFIX}chat_${compositeKey}`;
    memoryStore.set(key, contextData.messages, DEFAULT_TTL);
    try {
      const ls = getLocalStorage();
      if (ls) ls.setItem(key, JSON.stringify(contextData.messages));
    } catch {}
  }
  try {
    const apiUrl = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || '';
    if (apiUrl) {
      await fetch(`${apiUrl}/api/context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionId, context: contextData }),
      });
    }
  } catch {}
  return true;
}

/**
 * Get context with userId + sessionId (compatible with server API)
 */
export async function getContext(userId, sessionId) {
  const compositeKey = `${userId}_${sessionId}`;
  const key = `${CONTEXT_PREFIX}chat_${compositeKey}`;
  let data = memoryStore.get(key);
  if (data) return { messages: data };
  try {
    const ls = getLocalStorage();
    if (ls) {
      const raw = ls.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        memoryStore.set(key, parsed, DEFAULT_TTL);
        return { messages: parsed };
      }
    }
  } catch {}
  try {
    const apiUrl = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || '';
    if (apiUrl) {
      const res = await fetch(`${apiUrl}/api/context/${encodeURIComponent(userId)}/${encodeURIComponent(sessionId)}`);
      if (res.ok) {
        const result = await res.json();
        if (result?.context?.messages) {
          memoryStore.set(key, result.context.messages, DEFAULT_TTL);
          try { const ls = getLocalStorage(); if (ls) ls.setItem(key, JSON.stringify(result.context.messages)); } catch {}
          return result.context;
        }
      }
    }
  } catch {}
  return null;
}

export default {
  addContextMessage,
  getContextMessages,
  clearContext,
  clearAllContext,
  getCacheStats,
  saveContext,
  getContext
};
