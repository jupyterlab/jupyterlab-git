global.fetch = require('jest-fetch-mock');
require("enzyme").configure({
    adapter: new (require('@wojtekmaj/enzyme-adapter-react-17'))
});