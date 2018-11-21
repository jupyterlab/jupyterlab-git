global.fetch = require('jest-fetch-mock');
require("enzyme").configure({
    adapter: new (require('enzyme-adapter-react-16'))
});