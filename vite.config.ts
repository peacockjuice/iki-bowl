import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const appVersion = env.APP_VERSION || process.env.GITHUB_SHA?.slice(0, 12) || `${Date.now()}`;

  return {
    base: env.BASE_PATH || '/',
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },
  };
});
