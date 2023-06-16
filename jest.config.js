const jestJupyterLab = require('@jupyterlab/testutils/lib/jest-config');

const esModules = [
  '.*@jupyterlab/',
  '@jupyter/ydoc',
  'lib0',
  'y\\-protocols',
  'y\\-websocket',
  'yjs'
].join('|');

const jlabConfig = jestJupyterLab(__dirname);

const {
  moduleFileExtensions,
  moduleNameMapper,
  preset,
  setupFilesAfterEnv,
  testPathIgnorePatterns,
  transform
} = jlabConfig;

module.exports = {
  moduleFileExtensions,
  moduleNameMapper,
  modulePathIgnorePatterns: [
    '<rootDir>/build',
    '<rootDir>/jupyterlab_git',
    '<rootDir>/jupyter-config',
    '<rootDir>/ui-tests'
  ],
  preset,
  setupFilesAfterEnv,
  setupFiles: ['<rootDir>/testutils/jest-setup-files.js'],
  testPathIgnorePatterns,
  transform,
  automock: false,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/.ipynb_checkpoints/*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['lcov', 'text'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json'
    }
  },
  testRegex: 'src/.*/.*.spec.ts[x]?$',
  transformIgnorePatterns: [`/node_modules/(?!${esModules}).+`]
};
