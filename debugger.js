/**
 * ELA.js — Smart AI Debugger
 * Human-readable errors, AI-powered suggestions, runtime analysis
 */

const ERROR_DB = {
  UNDEFINED_PROPERTY: {
    emoji: '🔍',
    title: 'Property Not Found',
    template: ({ key }) =>
      `You're trying to access "${key}" but it's not defined in your component's data(), props, or methods.`,
    fix: ({ key }) =>
      `Add "${key}" to your data() return object:\n  data() { return { ${key}: null } }`,
    docs: 'https://ela.js.dev/docs/components#data',
  },
  MOUNT_TARGET_NOT_FOUND: {
    emoji: '🎯',
    title: 'Mount Target Missing',
    template: () => `ELA couldn't find the container element to mount your app.`,
    fix: () => `Make sure the DOM element exists before calling .mount().\nWrap in DOMContentLoaded or place script at end of <body>.`,
    docs: 'https://ela.js.dev/docs/mounting',
  },
  ROUTE_NOT_FOUND: {
    emoji: '🗺️',
    title: 'Route Not Matched',
    template: ({ path }) => `No route matched the path "${path}".`,
    fix: () => `Add a catch-all route:\n  { path: '*', component: NotFoundPage }`,
    docs: 'https://ela.js.dev/docs/router#404',
  },
  NULL_ACCESS: {
    emoji: '❌',
    title: 'Null Reference',
    template: ({ expr }) => `Tried to access a property on null or undefined in: "${expr}"`,
    fix: () => `Use optional chaining: user?.name instead of user.name\nOr add a loading/guard check before the expression.`,
    docs: 'https://ela.js.dev/docs/debugging#null',
  },
  ASYNC_STATE_RACE: {
    emoji: '⏱️',
    title: 'Async State Race Condition',
    template: ({ key }) => `You're reading "${key}" before an async operation completes.`,
    fix: ({ key }) =>
      `Add a loading state:\n  data() { return { ${key}: null, loading: true } }\nThen set loading = false in your fetch callback.`,
    docs: 'https://ela.js.dev/docs/async',
  },
  TEMPLATE_PARSE_ERROR: {
    emoji: '🧩',
    title: 'Template Syntax Error',
    template: () => `ELA couldn't parse your component template.`,
    fix: () => `Check for:\n  - Unclosed HTML tags\n  - Invalid characters in :attr bindings\n  - Missing quotes around attribute values`,
    docs: 'https://ela.js.dev/docs/templates',
  },
  EVENT_HANDLER_ERROR: {
    emoji: '🎯',
    title: 'Event Handler Failed',
    template: ({ expr }) => `An error occurred inside event handler: "${expr}"`,
    fix: () => `Check the handler for runtime errors. Wrap in try/catch for graceful handling.`,
    docs: 'https://ela.js.dev/docs/events',
  },
  UNKNOWN: {
    emoji: '🔧',
    title: 'Runtime Error',
    template: ({ message }) => message || 'An unexpected error occurred.',
    fix: () => `Check the stack trace below. Enable ELA devtools for deeper inspection.`,
    docs: 'https://ela.js.dev/docs/debugging',
  },
};

class ElaDebugger {
  constructor() {
    this.__enabled = true;
    this.__logs = [];
    this.__errorCount = 0;
    this.__warnCount = 0;
    this.__onError = null;
    this.__onWarn = null;
  }

  configure({ enabled = true, onError, onWarn } = {}) {
    this.__enabled = enabled;
    this.__onError = onError;
    this.__onWarn = onWarn;
  }

  throw(code, context = {}) {
    const entry = ERROR_DB[code] || ERROR_DB.UNKNOWN;
    const message = entry.template(context);
    const fix = entry.fix(context);
    const error = new ElaError(`[ELA] ${entry.title}: ${message}`, {
      code, title: entry.title, emoji: entry.emoji, message, fix, docs: entry.docs, context,
    });
    this.__log('error', error);
    this.__onError?.(error);
    if (this.__enabled) this.__printError(error);
    throw error;
  }

  warn(code, context = {}) {
    const entry = ERROR_DB[code] || ERROR_DB.UNKNOWN;
    const message = entry.template(context);
    const fix = entry.fix(context);
    this.__warnCount++;
    const warning = { code, title: entry.title, emoji: entry.emoji, message, fix, context };
    this.__log('warn', warning);
    this.__onWarn?.(warning);
    if (this.__enabled) {
      console.warn(`%c${entry.emoji} ELA Warning — ${entry.title}`, 'color:#f59e0b;font-weight:bold;');
      console.warn(`%c${message}`, 'color:#fbbf24;');
      console.warn(`%c💡 Fix: ${fix}`, 'color:#6ee7b7;');
    }
  }

  catch(err, context = {}) {
    const analysis = this.__analyzeError(err, context);
    this.__log('error', { native: err, analysis });
    this.__errorCount++;
    if (this.__enabled) {
      const emoji = ERROR_DB[analysis.code]?.emoji || '🔧';
      console.error(`%c${emoji} ELA Smart Debug — ${analysis.title || 'Runtime Error'}`, 'color:#ef4444;font-weight:bold;font-size:13px;');
      console.error(`%cWhat happened: ${analysis.message}`, 'color:#fecaca;');
      console.error(`%c💡 Fix: ${analysis.fix}`, 'color:#a7f3d0;');
      if (context.component) console.error(`%c📦 Component: ${context.component}`, 'color:#93c5fd;');
      console.error(`%c📖 Docs: ${analysis.docs}`, 'color:#a5b4fc;');
      console.groupCollapsed('%cOriginal Error', 'color:#6b7280;font-size:11px;');
      console.error(err);
      console.groupEnd();
    }
    this.__onError?.({ native: err, analysis });
  }

  __analyzeError(err, context) {
    const msg = err.message || '';
    if (/cannot read prop/i.test(msg) || /undefined.*property/i.test(msg)) {
      return { code: 'NULL_ACCESS', ...ERROR_DB.NULL_ACCESS,
        message: ERROR_DB.NULL_ACCESS.template({ expr: context.expr || msg }),
        fix: ERROR_DB.NULL_ACCESS.fix(context), docs: ERROR_DB.NULL_ACCESS.docs };
    }
    if (context.context === 'template render') {
      return { code: 'TEMPLATE_PARSE_ERROR', ...ERROR_DB.TEMPLATE_PARSE_ERROR,
        message: ERROR_DB.TEMPLATE_PARSE_ERROR.template(context),
        fix: ERROR_DB.TEMPLATE_PARSE_ERROR.fix(context), docs: ERROR_DB.TEMPLATE_PARSE_ERROR.docs };
    }
    if (context.context === 'event handler') {
      return { code: 'EVENT_HANDLER_ERROR', ...ERROR_DB.EVENT_HANDLER_ERROR,
        message: ERROR_DB.EVENT_HANDLER_ERROR.template(context),
        fix: ERROR_DB.EVENT_HANDLER_ERROR.fix(context), docs: ERROR_DB.EVENT_HANDLER_ERROR.docs };
    }
    return { code: 'UNKNOWN', title: 'Runtime Error',
      message: msg || 'An unexpected runtime error occurred.',
      fix: ERROR_DB.UNKNOWN.fix({}), docs: ERROR_DB.UNKNOWN.docs };
  }

  __printError(error) {
    console.error(`%c${error.meta.emoji} ELA Error — ${error.meta.title}`, 'color:#ef4444;font-weight:bold;font-size:13px;');
    console.error(`%c${error.meta.message}`, 'color:#fecaca;');
    console.error(`%c💡 Fix:\n${error.meta.fix}`, 'color:#a7f3d0;');
    console.error(`%c📖 ${error.meta.docs}`, 'color:#a5b4fc;');
  }

  __log(type, data) {
    this.__logs.push({ type, timestamp: Date.now(), data });
    if (this.__logs.length > 200) this.__logs.shift();
  }

  getLogs() { return [...this.__logs]; }
  getStats() { return { errors: this.__errorCount, warnings: this.__warnCount, logs: this.__logs.length }; }
}

export class ElaError extends Error {
  constructor(message, meta) {
    super(message);
    this.name = 'ElaError';
    this.meta = meta;
  }
}

export const SmartDebugger = new ElaDebugger();
export default SmartDebugger;
