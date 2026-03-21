import { defineConfig, devices } from "@playwright/test";

const PORT = 3210;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: {
    command: `pnpm exec next dev --turbopack --hostname 127.0.0.1 --port ${PORT}`,
    url: `${BASE_URL}/decks?e2e=1`,
    timeout: 120_000,
    reuseExistingServer: false,
    env: {
      ENABLE_E2E_MOCK_DECKS: "1",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
