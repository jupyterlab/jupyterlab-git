import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  timeout: 60 * 1000,
  use: {
    // Browser options
    headless: true,

    // Context options
    viewport: { width: 1280, height: 720 },

    // Artifacts
    video: 'on'
  }
};

export default config;
