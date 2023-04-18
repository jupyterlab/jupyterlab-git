const jestJupyterLab = require('@jupyterlab/testutils/lib/jest-config');

const esModules = ['@jupyterlab/'].join('|');

const baseConfig = jestJupyterLab(__dirname);

module.exports = {
  ...baseConfig,
  automock: false,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/.ipynb_checkpoints/*'
  ],
  coverageReporters: ['lcov', 'text'],
  testRegex: 'src/.*/.*.spec.ts[x]?$',
  transformIgnorePatterns: [
    ...baseConfig.transformIgnorePatterns,
    `/node_modules/(?!${esModules}).+`
  ]
};
