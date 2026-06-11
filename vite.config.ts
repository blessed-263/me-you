import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const medusaApiUrl =
    env.VITE_MEDUSA_API_URL?.replace(/\/$/, '') || 'http://127.0.0.1:9000';
  const apiPort = env.API_PORT || process.env.API_PORT || '3001';

  if (mode === 'production' && env.VITE_USE_MOCK_DATA === 'true') {
    console.warn(
      '[vite] VITE_USE_MOCK_DATA=true in a production build — mock auth will be enabled. Set VITE_USE_MOCK_DATA=false for live AmpEx.',
    );
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${apiPort}`,
          changeOrigin: true,
        },
        '/store': {
          target: medusaApiUrl,
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: '',
        },
        '/get-publishable-key': {
          target: medusaApiUrl,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
