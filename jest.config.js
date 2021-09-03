var tsConfig = require('./tsconfig.json');

var tsOptions = tsConfig['compilerOptions'];
// Need as the test folder is not visible from the src folder
tsOptions['rootDir'] = null;
tsOptions['inlineSourceMap'] = true;

const esModules = [
  '.*@jupyterlab/',
  'lib0',
  'y\\-protocols',
  'y\\-websocket',
  'yjs'
].join('|');

module.exports = {
  automock: false,
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\.(svg)$': '<rootDir>/testutils/jest-file-mock.js'
  },
  preset: 'ts-jest/presets/js-with-babel',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  modulePathIgnorePatterns: [
    '<rootDir>/build',
    '<rootDir>/jupyterlab_git',
    '<rootDir>/jupyter-config'
  ],
  setupFiles: ['<rootDir>/testutils/jest-setup-files.js'],
  testPathIgnorePatterns: [
    '/lib/',
    '/node_modules/',
    '/jupyterlab_git/',
    '/ui-tests/'
  ],
  testRegex: '/tests/.*.spec.ts[x]?$',
  transformIgnorePatterns: [`/node_modules/(?!${esModules}).+`],
  globals: {
    'ts-jest': {
      tsconfig: tsOptions
    }
  }
};
