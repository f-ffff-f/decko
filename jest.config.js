module.exports = {
  preset: 'ts-jest',
  setupFiles: ['./tests/jest.setup.js'],
  testMatch: ['<rootDir>/tests/**/*.[jt]s?(x)'],
  testPathIgnorePatterns: ['/tests/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}
