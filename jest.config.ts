/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'], // Explicitly define test file patterns
  moduleDirectories: ['node_modules', '<rootDir>/src'], // Ensure proper module resolution
};
