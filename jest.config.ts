import type { Config } from '@jest/types';

// Root-level Jest configuration for the monorepo.  This ensures the
// VS Code Jest extension (and any other tooling) can locate a valid
// config no matter where tests are executed from.  We mirror the
// backend's settings since that's where all TypeScript tests currently
// live, but the file can be expanded if additional packages adopt
// Jest later on.

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['<rootDir>/apps/backend/src/**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/apps/backend/tsconfig.json',
    },
  },
  // by default jest will ignore node_modules, which is fine; the
  // spec files are inside apps/backend/src so the backend package
  // config (in its package.json) still applies when running from
  // there.
};

export default config;
