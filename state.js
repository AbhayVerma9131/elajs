/**
 * ELA.js — Reactive State System
 * Proxy-based deep reactivity with watchers and computed values
 */

export class ElaState {
  constructor(initialData = {}, onChange) {
    this.__raw_data = deepClone(initialData);
    this.__onChange = onChange;
    this.__watchers = new Map();
    this.__computed = new Map();
    this.__proxy = this.__createProxy(this.__raw_data);
  }

  __createProxy(target, path = '') {
    return new Proxy(target, {
      get: (obj, key) => {
        if (typeof key === 'symbol') return obj[key];
        const val = obj[key];
        if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
          return this.__createProxy(val, path ? `${path}.${key}` : key);
        }
        return val;
      },
      set: (obj, key, value) => {
        const fullPath = path ? `${path}.${key}` : key;
        const oldValue = obj[key];
        obj[key] = value;

        if (!deepEqual(oldValue, value)) {
          this.__triggerWatchers(fullPath, value, oldValue);
          this.__onChange?.();
        }
        return true;
      },
    });
  }

  // Get a value by dot-path
  get(path) {
    return path.split('.').reduce((acc, key) => acc?.[key], this.__raw_data);
  }

  // Set a value by dot-path
  set(path, value) {
    const parts = path.split('.');
    let target = this.__raw_data;
    for (let i = 0; i < parts.length - 1; i++) {
      target = target[parts[i]];
    }
    const lastKey = parts[parts.length - 1];
    const oldValue = target[lastKey];
    target[lastKey] = value;

    if (!deepEqual(oldValue, value)) {
      this.__triggerWatchers(path, value, oldValue);
      this.__onChange?.();
    }
  }

  // Batch multiple updates, only trigger one re-render
  batch(fn) {
    const oldOnChange = this.__onChange;
    this.__onChange = null;
    fn(this.__proxy);
    this.__onChange = oldOnChange;
    this.__onChange?.();
  }

  // Register a computed value
  computed(name, fn) {
    this.__computed.set(name, fn);
    Object.defineProperty(this.__proxy, name, {
      get: () => fn(this.__raw_data),
      enumerable: true,
    });
  }

  // Watch a path for changes
  __watch(path, callback) {
    if (!this.__watchers.has(path)) {
      this.__watchers.set(path, []);
    }
    const watchers = this.__watchers.get(path);
    const watcher = { callback, stop: () => watchers.splice(watchers.indexOf(watcher), 1) };
    watchers.push(watcher);
    return watcher;
  }

  __triggerWatchers(path, newVal, oldVal) {
    // Exact match
    this.__watchers.get(path)?.forEach(w => w.callback(newVal, oldVal));

    // Wildcard parent watchers
    const parts = path.split('.');
    for (let i = 1; i < parts.length; i++) {
      const parentPath = parts.slice(0, i).join('.');
      this.__watchers.get(parentPath)?.forEach(w =>
        w.callback(this.get(parentPath), null)
      );
    }
  }

  __raw() {
    return this.__raw_data;
  }

  // Expose proxy for template access
  get $() {
    return this.__proxy;
  }
}

// --- Global Store (Vuex-like) ---

class ElaStore {
  constructor({ state = {}, mutations = {}, actions = {}, getters = {} } = {}) {
    this.__state = new ElaState(state);
    this.__mutations = mutations;
    this.__actions = actions;
    this.__getters = getters;
    this.__subscribers = [];

    // Build getters
    this.getters = {};
    for (const [key, fn] of Object.entries(getters)) {
      Object.defineProperty(this.getters, key, {
        get: () => fn(this.__state.__raw()),
        enumerable: true,
      });
    }
  }

  get state() {
    return this.__state.__raw();
  }

  commit(type, payload) {
    const mutation = this.__mutations[type];
    if (!mutation) {
      throw new Error(`[ELA Store] Unknown mutation: "${type}"`);
    }
    mutation(this.__state.__raw(), payload);
    this.__state.__onChange?.();
    this.__subscribers.forEach(s => s({ type, payload }, this.state));
  }

  async dispatch(type, payload) {
    const action = this.__actions[type];
    if (!action) {
      throw new Error(`[ELA Store] Unknown action: "${type}"`);
    }
    return action({ commit: this.commit.bind(this), state: this.state, dispatch: this.dispatch.bind(this) }, payload);
  }

  subscribe(fn) {
    this.__subscribers.push(fn);
    return () => this.__subscribers.splice(this.__subscribers.indexOf(fn), 1);
  }
}

export function createStore(options) {
  return new ElaStore(options);
}

// --- Utils ---

function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepClone);
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, deepClone(v)]));
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(k => deepEqual(a[k], b[k]));
}
