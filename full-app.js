/**
 * ELA.js — Complete Example App
 * Demonstrates: createApp, defineComponent, router, store, voice, AI, forms, http
 */

import {
  createApp,
  defineComponent,
  createRouter,
  createStore,
  createVoice,
  createAI,
  FormsPlugin,
  HttpPlugin,
  I18nPlugin,
  AnimationsPlugin,
  html,
  repeat,
  when,
} from 'ela.js';

// ============================
// 1. Global Store
// ============================

const store = createStore({
  state: {
    user: null,
    theme: 'dark',
    todos: [],
    notifications: [],
  },
  mutations: {
    SET_USER(state, user) { state.user = user; },
    SET_THEME(state, theme) { state.theme = theme; },
    ADD_TODO(state, todo) { state.todos.push({ id: Date.now(), text: todo, done: false }); },
    TOGGLE_TODO(state, id) {
      const todo = state.todos.find(t => t.id === id);
      if (todo) todo.done = !todo.done;
    },
    REMOVE_TODO(state, id) { state.todos = state.todos.filter(t => t.id !== id); },
    ADD_NOTIFICATION(state, msg) {
      state.notifications.push({ id: Date.now(), msg });
      setTimeout(() => state.notifications.shift(), 3000);
    },
  },
  actions: {
    async fetchUser({ commit }, userId) {
      const res = await fetch(`/api/users/${userId}`);
      const user = await res.json();
      commit('SET_USER', user);
      return user;
    },
    async addTodo({ commit, state }, text) {
      commit('ADD_TODO', text);
      commit('ADD_NOTIFICATION', `Added: "${text}"`);
    },
  },
  getters: {
    completedTodos: (state) => state.todos.filter(t => t.done),
    pendingTodos: (state) => state.todos.filter(t => !t.done),
    todoCount: (state) => state.todos.length,
  },
});

// ============================
// 2. Components
// ============================

const NavBar = defineComponent({
  props: { title: 'ELA App' },

  template() {
    return html`
      <nav class="navbar">
        <div class="nav-brand">${this.title}</div>
        <div class="nav-links">
          <a href="/" onclick="event.preventDefault();window.__elaRouter?.push('/')">Home</a>
          <a href="/todos" onclick="event.preventDefault();window.__elaRouter?.push('/todos')">Todos</a>
          <a href="/about" onclick="event.preventDefault();window.__elaRouter?.push('/about')">About</a>
          <a href="/ai-demo" onclick="event.preventDefault();window.__elaRouter?.push('/ai-demo')">AI Demo</a>
        </div>
        <button class="voice-btn" id="voiceToggle">🎙️ Voice</button>
      </nav>
    `;
  },

  styles: `
    .navbar { display: flex; align-items: center; padding: 12px 24px; background: #0d1520;
      border-bottom: 1px solid rgba(0,245,160,0.2); gap: 24px; }
    .nav-brand { font-family: 'Space Mono', monospace; font-size: 1.2rem; font-weight: 700; color: #00f5a0; }
    .nav-links { display: flex; gap: 16px; flex: 1; }
    .nav-links a { color: #6b8a9a; text-decoration: none; font-size: 14px; transition: color 0.2s; }
    .nav-links a:hover { color: #00f5a0; }
    .voice-btn { background: rgba(0,245,160,0.1); border: 1px solid rgba(0,245,160,0.3);
      color: #00f5a0; padding: 6px 14px; border-radius: 20px; cursor: pointer; font-size: 12px; }
    .voice-btn:hover { background: rgba(0,245,160,0.2); }
  `,

  onMount() {
    this.$el = document.getElementById('voiceToggle');
  },
});

// --- Home Page ---

const HomePage = defineComponent({
  data() {
    return {
      greeting: 'Welcome to ELA.js',
      features: [
        { icon: '🤖', title: 'AI Engine', desc: 'Generate components from natural language prompts' },
        { icon: '🗣️', title: 'Voice Control', desc: 'Navigate and interact using your voice' },
        { icon: '🧠', title: 'Smart Debug', desc: 'Human-readable errors with AI-suggested fixes' },
        { icon: '🌐', title: 'Hybrid Rendering', desc: 'SSR + SSG + CSR, smart-switched per route' },
        { icon: '⚡', title: 'Reactive State', desc: 'Proxy-based deep reactivity with watchers' },
        { icon: '🔌', title: 'Plugin System', desc: 'Forms, HTTP, i18n, animations and more' },
      ],
    };
  },

  template() {
    return html`
      <div class="home">
        <div class="hero">
          <h1>${this.greeting}</h1>
          <p>The smart, AI-powered frontend framework that thinks, speaks, and builds with you.</p>
          <div class="hero-btns">
            <button class="btn-primary" onclick="window.__elaRouter?.push('/todos')">Try Todos</button>
            <button class="btn-ghost" onclick="window.__elaRouter?.push('/ai-demo')">AI Demo →</button>
          </div>
        </div>
        <div class="features-grid">
          ${repeat(this.features, (f) => `
            <div class="feature-card">
              <div class="feature-icon">${f.icon}</div>
              <h3>${f.title}</h3>
              <p>${f.desc}</p>
            </div>
          `)}
        </div>
      </div>
    `;
  },

  styles: `
    .home { padding: 2rem; max-width: 900px; margin: 0 auto; }
    .hero { text-align: center; padding: 4rem 0 3rem; }
    .hero h1 { font-size: 2.5rem; font-weight: 700; color: #00f5a0; margin-bottom: 1rem; }
    .hero p { font-size: 1.1rem; color: #6b8a9a; max-width: 500px; margin: 0 auto 2rem; }
    .hero-btns { display: flex; gap: 16px; justify-content: center; }
    .btn-primary { background: #00f5a0; color: #000; border: none; padding: 12px 28px;
      border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 14px; }
    .btn-ghost { background: transparent; border: 1px solid rgba(0,245,160,0.3); color: #00f5a0;
      padding: 12px 28px; border-radius: 6px; cursor: pointer; font-size: 14px; }
    .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
    .feature-card { background: #0d1520; border: 1px solid rgba(0,245,160,0.1); border-radius: 12px;
      padding: 1.5rem; transition: border-color 0.2s; }
    .feature-card:hover { border-color: rgba(0,245,160,0.4); }
    .feature-icon { font-size: 2rem; margin-bottom: 0.75rem; }
    .feature-card h3 { color: #e8f4f8; margin-bottom: 0.5rem; font-size: 1rem; }
    .feature-card p { color: #6b8a9a; font-size: 13px; line-height: 1.6; }
  `,
});

// --- Todos Page ---

const TodosPage = defineComponent({
  data() {
    return { input: '', filter: 'all' };
  },

  template() {
    const todos = this.$store?.state.todos || [];
    const filtered = this.filter === 'all' ? todos
      : this.filter === 'done' ? todos.filter(t => t.done)
      : todos.filter(t => !t.done);

    return html`
      <div class="todos-page">
        <h2>Todo List</h2>
        <div class="todo-input-row">
          <input ela-model="input" placeholder="Add a new todo..." class="todo-input" />
          <button class="btn-add" onclick="this.addTodo()">Add</button>
        </div>
        <div class="todo-filters">
          <button class="${this.filter === 'all' ? 'active' : ''}" onclick="this.setFilter('all')">All</button>
          <button class="${this.filter === 'pending' ? 'active' : ''}" onclick="this.setFilter('pending')">Pending</button>
          <button class="${this.filter === 'done' ? 'active' : ''}" onclick="this.setFilter('done')">Done</button>
        </div>
        <div class="todo-list">
          ${filtered.length === 0
            ? '<div class="todo-empty">No todos here. Add one above!</div>'
            : repeat(filtered, (t) => `
              <div class="todo-item ${t.done ? 'done' : ''}">
                <span class="todo-check" data-id="${t.id}">${t.done ? '✅' : '⬜'}</span>
                <span class="todo-text">${t.text}</span>
                <button class="todo-del" data-id="${t.id}">✕</button>
              </div>
            `)
          }
        </div>
        <div class="todo-stats">
          ${todos.filter(t => t.done).length} / ${todos.length} completed
        </div>
      </div>
    `;
  },

  methods: {
    addTodo() {
      const text = this.state.get('input').trim();
      if (!text) return;
      this.$store?.dispatch('addTodo', text);
      this.state.set('input', '');
    },
    setFilter(f) { this.state.set('filter', f); },
    toggleTodo(id) { this.$store?.commit('TOGGLE_TODO', id); },
    removeTodo(id) { this.$store?.commit('REMOVE_TODO', id); },
  },

  styles: `
    .todos-page { padding: 2rem; max-width: 600px; margin: 0 auto; }
    h2 { color: #00f5a0; margin-bottom: 1.5rem; font-size: 1.5rem; }
    .todo-input-row { display: flex; gap: 12px; margin-bottom: 1rem; }
    .todo-input { flex: 1; background: #0d1520; border: 1px solid rgba(0,245,160,0.2);
      color: #e8f4f8; padding: 10px 14px; border-radius: 8px; font-size: 14px; outline: none; }
    .todo-input:focus { border-color: #00f5a0; }
    .btn-add { background: #00f5a0; color: #000; border: none; padding: 10px 20px;
      border-radius: 8px; font-weight: 700; cursor: pointer; }
    .todo-filters { display: flex; gap: 8px; margin-bottom: 1.5rem; }
    .todo-filters button { background: transparent; border: 1px solid rgba(0,245,160,0.2);
      color: #6b8a9a; padding: 6px 16px; border-radius: 20px; cursor: pointer; font-size: 12px; }
    .todo-filters button.active { background: rgba(0,245,160,0.1); border-color: #00f5a0; color: #00f5a0; }
    .todo-item { display: flex; align-items: center; gap: 12px; padding: 12px;
      background: #0d1520; border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 8px; }
    .todo-item.done .todo-text { text-decoration: line-through; color: #6b8a9a; }
    .todo-check { cursor: pointer; font-size: 1.2rem; }
    .todo-text { flex: 1; color: #e8f4f8; font-size: 14px; }
    .todo-del { background: transparent; border: none; color: #6b8a9a; cursor: pointer;
      font-size: 14px; padding: 4px 8px; border-radius: 4px; }
    .todo-del:hover { color: #ef4444; background: rgba(239,68,68,0.1); }
    .todo-empty { color: #6b8a9a; text-align: center; padding: 2rem; }
    .todo-stats { color: #6b8a9a; font-size: 12px; text-align: right; margin-top: 1rem; }
  `,

  onMount() {
    // Event delegation for todos
    this.__el?.addEventListener('click', (e) => {
      const check = e.target.closest('.todo-check');
      const del = e.target.closest('.todo-del');
      if (check) this.toggleTodo(Number(check.dataset.id));
      if (del) this.removeTodo(Number(del.dataset.id));
    });
  },
});

// --- AI Demo Page ---

const AIDemoPage = defineComponent({
  data() {
    return {
      prompt: '',
      result: '',
      loading: false,
      error: '',
    };
  },

  template() {
    return html`
      <div class="ai-demo">
        <h2>AI Component Generator</h2>
        <p class="ai-sub">Describe a UI component and ELA.js AI will generate it for you.</p>
        <div class="ai-input-row">
          <input ela-model="prompt" placeholder='e.g. "Create a login form with email and password"' class="ai-input" />
          <button class="btn-generate" onclick="this.generate()">
            ${this.loading ? '⏳ Generating...' : '🤖 Generate'}
          </button>
        </div>
        ${when(this.error, () => `<div class="ai-error">${this.error}</div>`)}
        ${when(this.result, () => `
          <div class="ai-result">
            <div class="ai-result-label">Generated Component Code</div>
            <pre class="ai-code">${this.result}</pre>
          </div>
        `)}
        <div class="ai-examples">
          <div class="ai-example-label">Try these prompts:</div>
          ${repeat([
            'Create a signup form with name, email, password',
            'Build a weather card with city, temperature, icon',
            'Make a pricing table with 3 tiers',
            'Create a notification toast component',
          ], (ex) => `
            <button class="ai-example-btn" onclick="this.useExample('${ex}')">${ex}</button>
          `)}
        </div>
      </div>
    `;
  },

  methods: {
    async generate() {
      const prompt = this.state.get('prompt').trim();
      if (!prompt) return;
      this.state.set('loading', true);
      this.state.set('error', '');
      this.state.set('result', '');
      try {
        const ai = createAI();
        const result = await ai.generate(prompt);
        this.state.set('result', result.code || JSON.stringify(result, null, 2));
      } catch (err) {
        this.state.set('error', `AI generation failed: ${err.message}. Make sure you have an Anthropic API key set up.`);
      } finally {
        this.state.set('loading', false);
      }
    },
    useExample(ex) {
      this.state.set('prompt', ex);
    },
  },

  styles: `
    .ai-demo { padding: 2rem; max-width: 720px; margin: 0 auto; }
    h2 { color: #00f5a0; margin-bottom: 0.5rem; font-size: 1.5rem; }
    .ai-sub { color: #6b8a9a; margin-bottom: 1.5rem; font-size: 14px; }
    .ai-input-row { display: flex; gap: 12px; margin-bottom: 1rem; }
    .ai-input { flex: 1; background: #0d1520; border: 1px solid rgba(0,245,160,0.2);
      color: #e8f4f8; padding: 12px 16px; border-radius: 8px; font-size: 14px; outline: none; }
    .ai-input:focus { border-color: #00f5a0; }
    .btn-generate { background: #00f5a0; color: #000; border: none; padding: 12px 20px;
      border-radius: 8px; font-weight: 700; cursor: pointer; white-space: nowrap; min-width: 140px; }
    .ai-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
      color: #fca5a5; border-radius: 8px; padding: 12px 16px; margin-bottom: 1rem; font-size: 13px; }
    .ai-result { background: #060a10; border: 1px solid rgba(0,245,160,0.2); border-radius: 10px; margin-bottom: 1.5rem; overflow: hidden; }
    .ai-result-label { background: rgba(0,245,160,0.05); padding: 10px 16px; font-size: 11px;
      color: #00f5a0; font-family: monospace; border-bottom: 1px solid rgba(0,245,160,0.1); }
    .ai-code { padding: 1.5rem; color: #6ee7b7; font-family: monospace; font-size: 12px;
      line-height: 1.8; white-space: pre-wrap; word-break: break-all; margin: 0; }
    .ai-examples { margin-top: 1.5rem; }
    .ai-example-label { font-size: 12px; color: #6b8a9a; margin-bottom: 10px; }
    .ai-example-btn { display: block; width: 100%; text-align: left; background: #0d1520;
      border: 1px solid rgba(0,245,160,0.1); color: #a0aec0; padding: 10px 14px; border-radius: 6px;
      cursor: pointer; font-size: 13px; margin-bottom: 6px; transition: all 0.2s; }
    .ai-example-btn:hover { border-color: rgba(0,245,160,0.4); color: #00f5a0; }
  `,
});

// --- About Page ---

const AboutPage = defineComponent({
  template() {
    return html`
      <div style="padding:2rem;max-width:600px;margin:0 auto;">
        <h2 style="color:#00f5a0;margin-bottom:1rem;">About ELA.js</h2>
        <p style="color:#a0aec0;line-height:1.8;margin-bottom:1rem;">
          ELA.js is a next-generation frontend framework that combines the flexibility of React,
          the structure of Angular, and the performance ideas of Svelte — with a unique layer of
          AI intelligence, voice control, and smart debugging.
        </p>
        <p style="color:#a0aec0;line-height:1.8;">
          Built for developers who want a co-developer, not just a rendering engine.
        </p>
        <div style="margin-top:2rem;padding:1rem 1.5rem;background:#0d1520;border:1px solid rgba(0,245,160,0.2);border-radius:10px;font-family:monospace;font-size:13px;color:#6ee7b7;">
          npm create ela-app@latest my-app
        </div>
      </div>
    `;
  },
});

// ============================
// 3. Router
// ============================

const router = createRouter({
  mode: 'history',
  routes: [
    { path: '/', component: HomePage },
    { path: '/todos', component: TodosPage },
    { path: '/ai-demo', component: AIDemoPage },
    { path: '/about', component: AboutPage },
    { path: '*', component: AboutPage },
  ],
});

// ============================
// 4. Voice Control
// ============================

const voice = createVoice({ devMode: true, minConfidence: 0.5 });

voice.register({
  'go home': () => router.push('/'),
  'open todos': () => router.push('/todos'),
  'open ai demo': () => router.push('/ai-demo'),
  'open about': () => router.push('/about'),
  'add todo': (transcript) => {
    const text = transcript.replace('add todo', '').trim();
    if (text) store.dispatch('addTodo', text);
  },
});

// ============================
// 5. Root App Component
// ============================

const App = defineComponent({
  template() {
    return html`
      <div class="ela-app">
        <div id="nav"></div>
        <main id="router-outlet"></main>
      </div>
    `;
  },

  styles: `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #080c14; color: #e8f4f8; font-family: 'Sora', system-ui, sans-serif; }
    .ela-app { min-height: 100vh; }
    main { min-height: calc(100vh - 60px); }
  `,

  onMount() {
    // Mount NavBar into nav slot
    new (class extends Component { constructor() { super(NavBar); } })()
      .mount(document.getElementById('nav'));

    // Set router outlet
    router.setOutlet(document.getElementById('router-outlet'));
  },
});

// ============================
// 6. Bootstrap
// ============================

const app = createApp(App, { debug: true, devtools: true });

app
  .use(new FormsPlugin())
  .use(new HttpPlugin({ baseURL: '/api' }))
  .use(new I18nPlugin({ locale: 'en', messages: { en: { app: { name: 'ELA.js' } } } }))
  .use(new AnimationsPlugin())
  .useRouter(router)
  .useStore(store)
  .mount('#app');

// Start voice after mount
setTimeout(() => voice.start(), 1000);

export { app, store, router, voice };
