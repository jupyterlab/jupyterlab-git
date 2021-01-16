var tsConfig = require ('./tsconfig.json');

var tsOptions = tsConfig["compilerOptions"];
// Need as the test folder is not visible from the src folder
tsOptions["rootDir"] = null;
tsOptions["inlineSourceMap"] = true;

module.exports = {
  automock: false,
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\.(svg)$': '<rootDir>/testutils/jest-file-mock.js'
  },
  preset: 'ts-jest/presets/js-with-babel',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFiles: ['<rootDir>/testutils/jest-setup-files.js'],
  testPathIgnorePatterns: ['/lib/', '/node_modules/', '/jupyterlab_git/'],
  testRegex: '/tests/.*.spec.ts[x]?$',
  transformIgnorePatterns: ['/node_modules/(?!(@jupyterlab/.*)/)'],
  globals: {
    'ts-jest': {
      tsconfig: tsOptions
    }
  }
};
