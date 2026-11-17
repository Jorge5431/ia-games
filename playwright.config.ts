import { defineConfig, devices } from '@playwright/test';

const integrated=process.env.VORNELIX_TEST_SUPABASE === '1';
export default defineConfig({
  testDir:'./e2e', timeout:90000, fullyParallel:false,workers:2,
  use:{
    baseURL:'http://localhost:3000',
    trace:'retain-on-failure',
    launchOptions:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:undefined,
  },
  projects:[{name:'chromium',use:{...devices['Desktop Chrome']}}],
  webServer:{
    command:'npm run start -- --hostname localhost',url:'http://localhost:3000',timeout:60000,reuseExistingServer:false,
    env:{
      NEXT_PUBLIC_SUPABASE_URL:integrated ? process.env.NEXT_PUBLIC_SUPABASE_URL || '' : '',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:integrated ? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '' : '',
      SITE_URL:'http://localhost:3000',VORNELIX_LOCAL_TEST:integrated?'1':'0',
    },
  },
});
