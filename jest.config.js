'use strict';

module.exports = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '/test/test-.*/.*.spec.ts$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['/dev_mode/', '/lib/', '/node_modules/'],
  automock: false,
  setupFiles: ['./setupJest.js']
};
