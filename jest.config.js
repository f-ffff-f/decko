export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['./tests/jest.setup.js'],
  testMatch: ['<rootDir>/tests/**/*.[jt]s?(x)'],
  testPathIgnorePatterns: ['/tests/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}
