/* global globalThis */
globalThis.DragEvent = class DragEvent {};
if (
  typeof globalThis.TextDecoder === 'undefined' ||
  typeof globalThis.TextEncoder === 'undefined'
) {
  const util = require('util');
  globalThis.TextDecoder = util.TextDecoder;
  globalThis.TextEncoder = util.TextEncoder;
}
const fetchMod = (window.fetch = require('node-fetch'));
window.Request = fetchMod.Request;
window.Headers = fetchMod.Headers;
window.Response = fetchMod.Response;
globalThis.Image = window.Image;
window.focus = () => {
  /* JSDom throws "Not Implemented" */
};
window.document.elementFromPoint = (left, top) => document.body;
if (!window.hasOwnProperty('getSelection')) {
  // Minimal getSelection() that supports a fake selection
  window.getSelection = function getSelection() {
    return {
      _selection: '',
      selectAllChildren: () => {
        this._selection = 'foo';
      },
      toString: () => {
        const val = this._selection;
        this._selection = '';
        return val;
      }
    };
  };
}
// Used by xterm.js
window.matchMedia = function (media) {
  return {
    matches: false,
    media,
    onchange: () => {
      /* empty */
    },
    addEventListener: () => {
      /* empty */
    },
    removeEventListener: () => {
      /* empty */
    },
    dispatchEvent: () => {
      return true;
    },
    addListener: () => {
      /* empty */
    },
    removeListener: () => {
      /* empty */
    }
  };
};
process.on('unhandledRejection', (error, promise) => {
  console.error('Unhandled promise rejection somewhere in tests');
  if (error) {
    console.error(error);
    const stack = error.stack;
    if (stack) {
      console.error(stack);
    }
  }
  promise.catch(err => console.error('promise rejected', err));
});
if (window.requestIdleCallback === undefined) {
  // On Safari, requestIdleCallback is not available, so we use replacement functions for `idleCallbacks`
  // See: https://developer.mozilla.org/en-US/docs/Web/API/Background_Tasks_API#falling_back_to_settimeout
  // eslint-disable-next-line @typescript-eslint/ban-types
  window.requestIdleCallback = function (handler) {
    let startTime = Date.now();
    return setTimeout(function () {
      handler({
        didTimeout: false,
        timeRemaining: function () {
          return Math.max(0, 50.0 - (Date.now() - startTime));
        }
      });
    }, 1);
  };
  window.cancelIdleCallback = function (id) {
    clearTimeout(id);
  };
}

globalThis.ResizeObserver = require('resize-observer-polyfill');
