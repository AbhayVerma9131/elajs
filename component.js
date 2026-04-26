/**
 * ELA.js — Core Component System
 * Reactive component engine with virtual DOM diffing
 */

import { SmartDebugger } from '../ai-engine/debugger.js';
import { ElaState } from './state.js';

let _componentId = 0;

export class Component {
  constructor(options = {}) {
    this.__id = `ela-${++_componentId}`;
    this.__mounted = false;
    this.__destroyed = false;
    this.__watchers = [];
    this.__children = [];
    this.__vdom = null;
    this.__el = null;
    this.__parent = null;

    this.props = options.props || {};
    this.state = new ElaState(options.data ? options.data() : {}, () => this.__scheduleUpdate());
    this.template = options.template || (() => '');
    this.methods = options.methods || {};
    this.hooks = {
      onMount: options.onMount || null,
      onUpdate: options.onUpdate || null,
      onDestroy: options.onDestroy || null,
    };
    this.components = options.components || {};
    this.styles = options.styles || '';

    // Bind methods to this instance
    for (const [name, fn] of Object.entries(this.methods)) {
      this[name] = fn.bind(this);
    }

    this.__pendingUpdate = false;
    this.__updateQueue = Promise.resolve();
  }

  // --- Lifecycle ---

  mount(container) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    if (!container) {
      SmartDebugger.throw('MOUNT_TARGET_NOT_FOUND', {
        hint: `mount() target not found. Make sure the selector exists in the DOM before calling mount().`,
        fix: `Check that your HTML has the element before ELA mounts.`,
      });
    }

    this.__el = container;
    this.__injectStyles();
    this.__vdom = this.__buildVDOM();
    const dom = this.__renderVDOM(this.__vdom);
    container.appendChild(dom);
    this.__mounted = true;
    this.hooks.onMount?.call(this);
    return this;
  }

  destroy() {
    if (this.__destroyed) return;
    this.__destroyed = true;
    this.__watchers.forEach(w => w.stop());
    this.__children.forEach(c => c.destroy());
    this.__el?.replaceChildren();
    this.hooks.onDestroy?.call(this);
  }

  // --- Reactivity ---

  watch(keyPath, callback) {
    const watcher = this.state.__watch(keyPath, callback.bind(this));
    this.__watchers.push(watcher);
    return watcher;
  }

  get $data() {
    return this.state.__raw();
  }

  __scheduleUpdate() {
    if (this.__pendingUpdate || this.__destroyed) return;
    this.__pendingUpdate = true;
    Promise.resolve().then(() => {
      this.__pendingUpdate = false;
      if (!this.__destroyed && this.__mounted) this.__update();
    });
  }

  __update() {
    const newVDOM = this.__buildVDOM();
    const patches = diff(this.__vdom, newVDOM);
    applyPatches(this.__el.firstChild, patches);
    this.__vdom = newVDOM;
    this.hooks.onUpdate?.call(this);
  }

  // --- Template / VDOM ---

  __buildVDOM() {
    try {
      const html = this.template.call(
        new Proxy(this, {
          get(target, key) {
            if (key in target.state.__raw()) return target.state.__raw()[key];
            if (key in target.props) return target.props[key];
            if (key in target) return target[key];
            SmartDebugger.warn('UNDEFINED_PROPERTY', {
              key,
              hint: `"${key}" is undefined on this component. Did you forget to declare it in data()?`,
            });
          },
        })
      );
      return parseHTML(html);
    } catch (err) {
      SmartDebugger.catch(err, { context: 'template render', component: this.__id });
      return { tag: 'div', attrs: {}, children: [] };
    }
  }

  __renderVDOM(vnode) {
    if (typeof vnode === 'string') {
      return document.createTextNode(vnode);
    }

    const el = document.createElement(vnode.tag);

    for (const [k, v] of Object.entries(vnode.attrs || {})) {
      if (k.startsWith('@')) {
        const event = k.slice(1);
        const handler = this[v] || this.__parseInlineHandler(v);
        el.addEventListener(event, handler);
      } else if (k === ':class') {
        el.className = this.__resolveBinding(v);
      } else if (k === ':style') {
        Object.assign(el.style, this.__resolveBinding(v));
      } else if (k.startsWith(':')) {
        const attr = k.slice(1);
        el.setAttribute(attr, this.__resolveBinding(v));
      } else if (k === 'ela-if') {
        if (!this.__resolveBinding(v)) return document.createComment('ela-if:false');
      } else if (k === 'ela-model') {
        el.value = this.__resolveBinding(v) ?? '';
        el.addEventListener('input', (e) => this.state.set(v, e.target.value));
      } else {
        el.setAttribute(k, v);
      }
    }

    for (const child of vnode.children || []) {
      el.appendChild(this.__renderVDOM(child));
    }

    return el;
  }

  __resolveBinding(expr) {
    try {
      const data = this.state.__raw();
      const fn = new Function(...Object.keys(data), `return ${expr}`);
      return fn(...Object.values(data));
    } catch {
      return undefined;
    }
  }

  __parseInlineHandler(expr) {
    return () => {
      try {
        const data = this.state.__raw();
        const fn = new Function(...Object.keys(data), expr);
        fn(...Object.values(data));
      } catch (err) {
        SmartDebugger.catch(err, { context: 'event handler', expr });
      }
    };
  }

  __injectStyles() {
    if (!this.styles) return;
    const styleId = `ela-style-${this.__id}`;
    if (document.getElementById(styleId)) return;
    const tag = document.createElement('style');
    tag.id = styleId;
    tag.textContent = this.styles;
    document.head.appendChild(tag);
  }
}

// --- Virtual DOM Diffing ---

export function parseHTML(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return vnodeFromElement(template.content.firstChild);
}

function vnodeFromElement(el) {
  if (!el) return { tag: 'div', attrs: {}, children: [] };
  if (el.nodeType === 3) return el.textContent;

  const attrs = {};
  for (const attr of el.attributes || []) {
    attrs[attr.name] = attr.value;
  }

  return {
    tag: el.tagName.toLowerCase(),
    attrs,
    children: Array.from(el.childNodes).map(vnodeFromElement).filter(Boolean),
  };
}

function diff(oldV, newV, patches = [], index = 0) {
  if (!oldV) {
    patches.push({ type: 'CREATE', newV, index });
  } else if (!newV) {
    patches.push({ type: 'REMOVE', index });
  } else if (changed(oldV, newV)) {
    patches.push({ type: 'REPLACE', newV, index });
  } else if (newV.tag) {
    const newAttrs = newV.attrs || {};
    const oldAttrs = oldV.attrs || {};
    const attrPatches = {};

    for (const key of new Set([...Object.keys(newAttrs), ...Object.keys(oldAttrs)])) {
      if (newAttrs[key] !== oldAttrs[key]) attrPatches[key] = newAttrs[key];
    }

    if (Object.keys(attrPatches).length) {
      patches.push({ type: 'ATTRS', attrPatches, index });
    }

    const maxLen = Math.max(
      (oldV.children || []).length,
      (newV.children || []).length
    );
    for (let i = 0; i < maxLen; i++) {
      diff((oldV.children || [])[i], (newV.children || [])[i], patches, index + i + 1);
    }
  }
  return patches;
}

function changed(a, b) {
  return typeof a !== typeof b || (typeof a === 'string' && a !== b) || a.tag !== b.tag;
}

function applyPatches(node, patches) {
  for (const patch of patches) {
    switch (patch.type) {
      case 'REPLACE':
        node?.parentNode?.replaceChild(createEl(patch.newV), node);
        break;
      case 'REMOVE':
        node?.parentNode?.removeChild(node);
        break;
      case 'ATTRS':
        for (const [k, v] of Object.entries(patch.attrPatches)) {
          if (v == null) node?.removeAttribute(k);
          else node?.setAttribute(k, v);
        }
        break;
    }
  }
}

function createEl(vnode) {
  if (typeof vnode === 'string') return document.createTextNode(vnode);
  const el = document.createElement(vnode.tag);
  for (const [k, v] of Object.entries(vnode.attrs || {})) el.setAttribute(k, v);
  for (const child of vnode.children || []) el.appendChild(createEl(child));
  return el;
}

// --- defineComponent helper ---

export function defineComponent(options) {
  return class extends Component {
    constructor(props) {
      super({ ...options, props });
    }
  };
}
