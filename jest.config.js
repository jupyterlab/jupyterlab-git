module.exports = {
  transform: {
    '\\.(ts|tsx)?$': 'ts-jest',
    '\\.(js|jsx)?$': './transform.js'
  },
  transformIgnorePatterns: ['/node_modules/(?!(@jupyterlab/.*)/)'],
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy'
  },
  testRegex: '/tests/test-.*/.*.spec.ts[x]?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['/dev_mode/', '/lib/', '/node_modules/'],
  automock: false,
  setupFilesAfterEnv: ['@jupyterlab/testutils/lib/jest-script.js'],
  setupFiles: ['./setupJest.js', '@jupyterlab/testutils/lib/jest-shim.js'],
  globals: { 'ts-jest': { tsConfig: 'tsconfig.json' } }
};
