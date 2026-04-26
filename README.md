# ⚡ ELA.js

> The AI-powered frontend framework that thinks, speaks, and builds with you.

---

## What is ELA.js?

ELA.js is a next-generation frontend framework combining:

- **The flexibility of React** — component-based, composable
- **The structure of Angular** — routing, DI, plugins, stores
- **The performance ideas of Svelte** — minimal overhead, smart re-rendering
- **AI + Voice + Smart Debugging** — your unique edge

---

## Quick Start

```bash
npm create ela-app@latest my-app
cd my-app && npm run dev
```

Or use directly:

```js
import { createApp, defineComponent } from 'ela.js';

const App = defineComponent({
  data() {
    return { count: 0 };
  },
  template() {
    return `
      <div>
        <h1>Count: ${this.count}</h1>
        <button @click="increment">+1</button>
      </div>
    `;
  },
  methods: {
    increment() {
      this.state.set('count', this.state.get('count') + 1);
    }
  }
});

createApp(App).mount('#app');
```

---

## Core Modules

### `createApp(RootComponent, options)`
Bootstraps your ELA application.

```js
const app = createApp(App, { debug: true, devtools: true });
app.use(new FormsPlugin())
   .useRouter(router)
   .useStore(store)
   .mount('#app');
```

---

### `defineComponent(options)`
Defines a reactive component.

| Option | Type | Description |
|---|---|---|
| `data()` | `Function` | Returns reactive state object |
| `template()` | `Function` | Returns HTML string with `${this.x}` bindings |
| `methods` | `Object` | Component methods |
| `props` | `Object` | Props passed from parent |
| `styles` | `String` | Scoped CSS string |
| `onMount()` | `Function` | Lifecycle: after DOM mount |
| `onUpdate()` | `Function` | Lifecycle: after re-render |
| `onDestroy()` | `Function` | Lifecycle: before unmount |

**Template directives:**

| Directive | Example | Description |
|---|---|---|
| `${this.x}` | `${this.name}` | Reactive interpolation |
| `@click` | `@click="doSomething"` | Event binding |
| `ela-model` | `ela-model="name"` | Two-way data binding |
| `:attr` | `:class="myClass"` | Dynamic attribute |
| `:style` | `:style="styleObj"` | Dynamic style |
| `ela-if` | `ela-if="isVisible"` | Conditional rendering |

---

### `createStore(options)`
Global reactive state management (Vuex-like).

```js
const store = createStore({
  state: { user: null, todos: [] },
  mutations: {
    SET_USER(state, user) { state.user = user; },
    ADD_TODO(state, text) { state.todos.push({ text, done: false }); },
  },
  actions: {
    async fetchUser({ commit }, id) {
      const user = await fetch(`/api/users/${id}`).then(r => r.json());
      commit('SET_USER', user);
    }
  },
  getters: {
    doneTodos: (state) => state.todos.filter(t => t.done),
  }
});

// Usage inside component
this.$store.commit('ADD_TODO', 'Learn ELA.js');
this.$store.dispatch('fetchUser', 42);
this.$store.getters.doneTodos;
```

---

### `createRouter(options)`
Client-side router with history and hash modes.

```js
const router = createRouter({
  mode: 'history',  // 'history' | 'hash'
  routes: [
    { path: '/', component: HomePage },
    { path: '/user/:id', component: UserPage },
    { path: '/blog', component: BlogPage, children: [
      { path: '/:slug', component: BlogPost }
    ]},
    { path: '*', component: NotFoundPage },
  ]
});

// Navigation
router.push('/user/42');
router.replace('/home');
router.back();

// Guards
router.beforeEach((to, from) => {
  if (to.path === '/admin' && !isLoggedIn()) return '/login';
});

// Inside component
this.$router.push('/about');
this.$router.params; // { id: '42' }
this.$router.query;  // { search: 'hello' }
```

---

### `createVoice(options)`
Voice control with Web Speech API.

```js
const voice = createVoice({ devMode: true });

voice
  .on('open dashboard', () => router.push('/dashboard'))
  .on('add todo', (transcript) => {
    const text = transcript.replace('add todo', '').trim();
    store.commit('ADD_TODO', text);
  })
  .on(/go to (.+)/, (t, match) => router.push('/' + match[1]))
  .start();

// Text-to-speech
voice.speak('Welcome back!');

// Toggle mic
voice.toggle();
```

---

### `createAI(options)` — AI Engine
Generate components from natural language using Claude.

```js
const ai = createAI();

// Generate a component from a prompt
const result = await ai.generate('Create a login form with email and password');
console.log(result.code); // → full ELA component code

// Get fix suggestions for broken code
const fixed = await ai.fix(myCode, errorMessage);

// Review and improve code
const improved = await ai.suggest(myCode);
console.log(improved.suggestions); // ['Use optional chaining here', ...]
```

---

### `createSSR(options)` — Server-Side Rendering

```js
import { createSSR } from 'ela.js/ssr';
import express from 'express';

const ssr = createSSR({ cache: true, cacheTTL: 30000 });
const app = express();

app.get('/', async (req, res) => {
  const html = await ssr.renderPage(HomePage, {}, { req }, {
    title: 'My ELA App',
    description: 'Built with ELA.js',
  });
  res.send(html);
});

// Or use the middleware:
import { createSSRMiddleware } from 'ela.js/ssr';
app.use(createSSRMiddleware(routes));
```

Add `serverFetch` to your component for server-side data loading:

```js
const BlogPost = defineComponent({
  async serverFetch({ props }) {
    const post = await fetchPost(props.slug);
    return { post };
  },
  template() {
    return `<article><h1>${this.post?.title}</h1></article>`;
  }
});
```

---

### `createSSG(options)` — Static Site Generation

```js
import { createSSG } from 'ela.js/ssg';

const ssg = createSSG({ outDir: './dist', baseURL: 'https://mysite.com', sitemap: true });

ssg.addRoute('/', HomePage, { title: 'Home' });
ssg.addRoute('/about', AboutPage, { title: 'About' });

// Dynamic routes from data
ssg.addDynamicRoute('/blog/:slug', () => fetchAllPosts(), BlogPost, (post) => ({
  title: post.title, description: post.excerpt
}));

ssg.copyAssets('./public');
await ssg.build();
// → ./dist/index.html, ./dist/about/index.html, ./dist/blog/my-post/index.html, sitemap.xml
```

---

### Smart Debugger

No more cryptic errors. ELA gives you human-readable messages with fix suggestions.

```
❌ Normal JS:
"Cannot read properties of undefined (reading 'name')"

✅ ELA Smart Debug:
ELA Error — Null Reference
You tried to access a property on null or undefined in: "user.name"
💡 Fix: Use optional chaining: user?.name instead of user.name
      Or add a loading/guard check before the expression.
📖 https://ela.js.dev/docs/debugging#null
```

---

### Built-in Plugins

```js
// Forms
app.use(new FormsPlugin());
const form = this.$form.create({
  email: { value: '', rules: ['required', 'email'] },
  password: { value: '', rules: ['required', { min: 8 }] },
});
await form.submit(async (values) => { /* POST to API */ });

// HTTP
app.use(new HttpPlugin({ baseURL: 'https://api.myapp.com' }));
const { data } = await this.$http.get('/users');
await this.$http.post('/users', { name: 'Alice' });

// i18n
app.use(new I18nPlugin({
  locale: 'en',
  messages: { en: { hello: 'Hello, {name}!' }, hi: { hello: 'नमस्ते, {name}!' } }
}));
this.$t('hello', { name: 'Aryan' }); // → "Hello, Aryan!"

// Animations
app.use(new AnimationsPlugin());
await this.$animate.fadeIn(this.$el);
await this.$animate.shake(errorField);
this.$animate.observe('.card', 'visible'); // scroll-triggered
```

---

### DevTools

Press **Ctrl+Shift+E** in development to open the ELA DevTools panel:

- **Logs tab** — All ELA errors and warnings with fixes
- **State tab** — Live component state viewer
- **Routes tab** — Current route, params, all registered routes
- **Perf tab** — Performance marks and measures

---

## Architecture

```
ela.js/
├── src/
│   ├── core/
│   │   ├── component.js    ← Virtual DOM, reactivity, lifecycle
│   │   └── state.js        ← Proxy-based state, store, watchers
│   ├── ai-engine/
│   │   ├── generator.js    ← Prompt → Component via Claude API
│   │   └── debugger.js     ← Smart error system
│   ├── voice/
│   │   └── index.js        ← Web Speech API wrapper, TTS
│   ├── router/
│   │   └── index.js        ← History/hash router, guards, params
│   ├── ssr/
│   │   └── index.js        ← Server rendering + hydration
│   ├── ssg/
│   │   └── index.js        ← Static site generator + sitemap
│   ├── devtools/
│   │   └── index.js        ← In-browser developer panel
│   ├── plugins/
│   │   └── index.js        ← Forms, HTTP, i18n, animations
│   └── index.js            ← Main entry, createApp, public API
├── examples/
│   ├── full-app.js         ← Complete app demo
│   └── index.html
└── package.json
```

---

## Roadmap

- [ ] v1.1 — JSX/TSX support
- [ ] v1.2 — Suspense + lazy loading components
- [ ] v1.3 — Edge rendering (Cloudflare Workers)
- [ ] v1.4 — ELA CLI (`ela create`, `ela build`, `ela deploy`)
- [ ] v2.0 — Full AI co-pilot mode (real-time code generation in devtools)
- [ ] v2.1 — Visual drag-and-drop component builder

---

## License

MIT © ELA.js Contributors
