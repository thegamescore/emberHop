import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser',timeout:30000,workers:1,
  use:{baseURL:'http://localhost:4194',channel:'chrome',headless:true,screenshot:'only-on-failure'},
  webServer:{command:'npm run dev -- --port 4194 --strictPort',url:'http://localhost:4194',reuseExistingServer:!process.env.CI},
});
