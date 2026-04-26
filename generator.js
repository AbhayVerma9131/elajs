/**
 * ELA.js — AI Generator
 * Convert natural language prompts into ELA components using Claude API
 * Uses the Anthropic API for intelligent code generation
 */

const SYSTEM_PROMPT = `You are an ELA.js component generator. 
ELA.js is a frontend framework with this component structure:

import { defineComponent } from 'ela.js';

const MyComponent = defineComponent({
  data() {
    return { count: 0, name: '' };
  },
  template() {
    return \`
      <div class="my-component">
        <h2>Hello, \${this.name}!</h2>
        <p>Count: \${this.count}</p>
        <button @click="increment">+1</button>
        <input ela-model="name" placeholder="Your name" />
      </div>
    \`;
  },
  methods: {
    increment() {
      this.state.set('count', this.state.get('count') + 1);
    }
  },
  styles: \`
    .my-component { padding: 1rem; font-family: sans-serif; }
    button { padding: 8px 16px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer; }
    button:hover { background: #4f46e5; }
  \`,
  onMount() {
    console.log('Component mounted!');
  }
});

Key rules:
- Use \${this.propertyName} for reactive data in templates
- Use @click, @input, @change for events
- Use ela-model="propName" for two-way binding
- Use :class, :style for dynamic attributes
- Use ela-if="condition" for conditional rendering
- Styles are scoped CSS strings

Generate ONLY valid ELA.js component code. Return a JSON object with:
{ "code": "..the full component JS code..", "name": "..ComponentName..", "description": "..what it does.." }
No markdown, no backticks, pure JSON.`;

export class AIGenerator {
  constructor(options = {}) {
    this.__endpoint = 'https://api.anthropic.com/v1/messages';
    this.__model = 'claude-sonnet-4-20250514';
    this.__history = [];
    this.__onGenerate = options.onGenerate || null;
    this.__onError = options.onError || null;
  }

  /**
   * Generate an ELA component from a natural language prompt
   * @param {string} prompt - e.g. "Create a login form with email and password"
   * @returns {Promise<{code: string, name: string, description: string}>}
   */
  async generate(prompt) {
    this.__history.push({ role: 'user', content: prompt });

    const response = await fetch(this.__endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.__model,
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: this.__history,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`AI Generator API error: ${err.error?.message || response.status}`);
    }

    const data = await response.json();
    const text = data.content?.find(b => b.type === 'text')?.text || '';

    this.__history.push({ role: 'assistant', content: text });

    try {
      const result = JSON.parse(text);
      this.__onGenerate?.(result);
      return result;
    } catch {
      // If it's not JSON, wrap the raw code
      return { code: text, name: 'GeneratedComponent', description: prompt };
    }
  }

  /**
   * Ask the AI to fix a bug in existing component code
   * @param {string} code - Current component code
   * @param {string} errorMessage - The ELA error message
   * @returns {Promise<{code: string, explanation: string}>}
   */
  async fix(code, errorMessage) {
    const prompt = `Fix this ELA.js component code.\n\nError: ${errorMessage}\n\nCode:\n${code}\n\nReturn JSON: { "code": "..fixed code..", "explanation": "..what you changed and why.." }`;

    const response = await fetch(this.__endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.__model,
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.find(b => b.type === 'text')?.text || '';

    try {
      return JSON.parse(text);
    } catch {
      return { code, explanation: text };
    }
  }

  /**
   * Get improvement suggestions for existing component code
   * @param {string} code - Component code to review
   * @returns {Promise<{suggestions: string[], improvedCode: string}>}
   */
  async suggest(code) {
    const prompt = `Review this ELA.js component and give improvement suggestions.\n\nCode:\n${code}\n\nReturn JSON: { "suggestions": ["suggestion1", ...], "improvedCode": "..improved version.." }`;

    const response = await fetch(this.__endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.__model,
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.find(b => b.type === 'text')?.text || '';

    try {
      return JSON.parse(text);
    } catch {
      return { suggestions: [text], improvedCode: code };
    }
  }

  /**
   * Clear conversation history (start fresh generation)
   */
  reset() {
    this.__history = [];
  }
}

export function createAI(options) {
  return new AIGenerator(options);
}
