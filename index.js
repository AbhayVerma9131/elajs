/**
 * ELA.js — Main Entry Point
 * The smart, AI-powered frontend framework
 *
 * @version 1.0.0
 * @license MIT
 * @author ELA.js Contributors
 */

import { Component, defineComponent } from './core/component.js';
import { ElaState, createStore } from './core/state.js';
import { ElaRouter, createRouter, RouterLink } from './router/index.js';
import { SmartDebugger } from './ai-engine/debugger.js';
import { AIGenerator, createAI } from './ai-engine/generator.js';
import { VoiceController, createVoice } from './voice/index.js';
import { SSREngine, createSSR, createSSRMiddleware, hydrateApp } from './ssr/index.js';
import { SSGBuilder, createSSG } from './ssg/index.js';
import { ElaDevTools, createDevTools } from './devtools/index.js';
import {
  ElaPlugin, FormsPlugin, HttpPlugin, I18nPlugin, AnimationsPlugin, usePlugin
} from './plugins/index.js';

// --- ELA App ---

class ElaApp {
  constructor(rootComponent, options = {}) {
    this.__root = rootComponent;
    this.__instance = null;
    this.__plugins = [];
    this.__router = null;
    this.__store = null;
    this.__devtools = null;
    this.__el = null;
    this.__config = {
      debug: options.debug ?? true,
      devtools: options.devtools ?? true,
      ...options,
    };

    SmartDebugger.configure({
      enabled: this.__config.debug,
      onError: options.onError,
      onWarn: options.onWarn,
    });
  }

  /**
   * Install a plugin
   * @param {ElaPlugin|object} plugin
   * @param {object} options
   */
  use(plugin, options = {}) {
    if (typeof plugin === 'function') plugin = new plugin(options);
    if (this.__plugins.find(p => p.name === plugin.name)) {
      console.warn(`[ELA] Plugin "${plugin.name}" already installed.`);
      return this;
    }
    plugin.install(this);
    this.__plugins.push(plugin);
    return this;
  }

  /**
   * Attach a router
   */
  useRouter(router) {
    this.__router = router;
    return this;
  }

  /**
   * Attach a global store
   */
  useStore(store) {
    this.__store = store;
    return this;
  }

  /**
   * Mount the app to a DOM element
   * @param {string|HTMLElement} selector
   */
  mount(selector) {
    this.__el = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;

    if (!this.__el) {
      SmartDebugger.throw('MOUNT_TARGET_NOT_FOUND', { selector });
    }

    // Create root component instance
    const RootClass = this.__root;
    if (typeof RootClass === 'function' && RootClass.prototype?.mount) {
      this.__instance = new RootClass();
    } else {
      // Plain options object — wrap it
      const Wrapped = class extends Component {
        constructor() { super(RootClass); }
      };
      this.__instance = new Wrapped();
    }

    // Attach app-level globals to instance
    this.__instance.$app = this;
    if (this.__store) this.__instance.$store = this.__store;
    if (this.__router) {
      this.__router.install(this.__instance);
      this.__instance.$router = this.__router;
    }

    this.__instance.mount(this.__el);

    // Devtools
    if (this.__config.devtools && typeof window !== 'undefined') {
      this.__devtools = createDevTools();
      this.__devtools.install(this.__instance);
    }

    console.log(
      '%c⚡ ELA.js v1.0.0 — App mounted',
      'color:#00f5a0;font-weight:bold;font-size:13px;'
    );

    return this.__instance;
  }

  get $root() { return this.__instance; }
  get $router() { return this.__router; }
  get $store() { return this.__store; }
  get $devtools() { return this.__devtools; }
}

// --- createApp factory ---

export function createApp(rootComponent, options = {}) {
  return new ElaApp(rootComponent, options);
}

// --- Composables ---

/**
 * useRef — reactive ref for a single value
 */
export function useRef(initialValue) {
  const state = new ElaState({ value: initialValue }, () => {});
  return {
    get value() { return state.get('value'); },
    set value(v) { state.set('value', v); },
  };
}

/**
 * useComputed — a derived value computed from a function
 */
export function useComputed(fn) {
  return { get value() { return fn(); } };
}

/**
 * onMount / onDestroy lifecycle hooks for function-style components
 */
export function onMount(fn) { return { __hook: 'mount', fn }; }
export function onDestroy(fn) { return { __hook: 'destroy', fn }; }

// --- Template Helpers ---

export function html(strings, ...values) {
  return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '');
}

export function repeat(arr, template) {
  return Array.isArray(arr) ? arr.map(template).join('') : '';
}

export function when(condition, templateFn, elseFn = () => '') {
  return condition ? templateFn() : elseFn();
}

export function cls(...args) {
  return args.filter(Boolean).join(' ');
}

// --- Version ---
export const version = '1.0.0';
export const name = 'ELA.js';

// --- Re-exports ---
export {
  // Core
  Component,
  defineComponent,
  ElaState,
  createStore,

  // Router
  ElaRouter,
  createRouter,
  RouterLink,

  // AI Engine
  SmartDebugger,
  AIGenerator,
  createAI,

  // Voice
  VoiceController,
  createVoice,

  // SSR
  SSREngine,
  createSSR,
  createSSRMiddleware,
  hydrateApp,

  // SSG
  SSGBuilder,
  createSSG,

  // DevTools
  ElaDevTools,
  createDevTools,

  // Plugins
  ElaPlugin,
  FormsPlugin,
  HttpPlugin,
  I18nPlugin,
  AnimationsPlugin,
  usePlugin,
};

// Default export for CDN usage
export default {
  createApp, defineComponent, createRouter, createStore, createVoice, createAI,
  createSSR, createSSG, createDevTools, usePlugin, html, repeat, when, cls,
  version, name,
};
