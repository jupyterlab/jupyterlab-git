// JupyterLab's shims (DragEvent, IntersectionObserver, ResizeObserver,
// matchMedia, ...) plus project-specific overrides below.
const nativeRange = window.Range;
const nativeCreateRange = window.document.createRange;
require('@jupyterlab/testing/lib/jest-shim');

// The upstream shim replaces jsdom's Range and document.createRange with
// minimal fakes; @testing-library/user-event needs the native ones.
window.Range = nativeRange;
window.document.createRange = nativeCreateRange;

const fetchMod = (window.fetch = require('node-fetch'));
window.Request = fetchMod.Request;
window.Headers = fetchMod.Headers;
window.Response = fetchMod.Response;

// Replace the upstream no-op ResizeObserver mock with a functional polyfill.
globalThis.ResizeObserver = require('resize-observer-polyfill');
