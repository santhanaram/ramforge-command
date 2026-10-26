import { defineConfig, devices } from '@playwright/test';

// Browser tests run against a production build in demo mode (no Supabase, simulated AI).
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://localhost:3210', trace: 'retain-on-failure' },
  webServer: {
    command: 'npx next start -p 3210',
    url: 'http://localhost:3210',
    reuseExistingServer: false,
    timeout: 120_000,
    env: { ALLOW_PUBLIC_DEMO: 'true', NEXT_PUBLIC_SUPABASE_URL: '', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '', ANTHROPIC_API_KEY: '' },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
});
