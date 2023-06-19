globalThis.fetch = require('jest-fetch-mock');
// Use node crypto for crypto
globalThis.crypto = require('crypto');

require('enzyme').configure({
  adapter: new (require('@wojtekmaj/enzyme-adapter-react-17'))()
});
