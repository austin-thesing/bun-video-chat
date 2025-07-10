import { test, expect } from 'bun:test';

test('basic test setup', () => {
  expect(1 + 1).toBe(2);
});

test('environment variables', () => {
  // Test that Bun automatically loads .env files
  expect(process.env.NODE_ENV).toBe('test'); // Bun sets this to 'test' during testing
  expect(process.env.PORT).toBe('3001');
});