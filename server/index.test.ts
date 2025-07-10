import { test, expect } from 'bun:test';

test('basic test setup', () => {
  expect(1 + 1).toBe(2);
});

test('environment variables', () => {
  // Test that environment variables are accessible
  expect(process.env.NODE_ENV).toBeDefined();
  expect(process.env.PORT || '5000').toBeTruthy();
});
