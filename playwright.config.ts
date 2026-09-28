import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser',timeout:30000,workers:1,
  use:{baseURL:'http://localhost:4297',channel:'chrome',headless:true,screenshot:'only-on-failure'},
  webServer:{command:'npm run build && npm run preview -- --port 4297 --strictPort',url:'http://localhost:4297',reuseExistingServer:false},
});
