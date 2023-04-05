globalThis.fetch = require('jest-fetch-mock');
require("enzyme").configure({
    adapter: new (require('@wojtekmaj/enzyme-adapter-react-17'))
});

// Use node crypto for crypto
globalThis.crypto = require('node:crypto');
