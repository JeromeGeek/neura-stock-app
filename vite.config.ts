import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'https://finnhub.io/api/v1',
            changeOrigin: true,
            rewrite: (path) => {
              // Remove /api prefix and add token
              const newPath = path.replace(/^\/api/, '');
              const separator = newPath.includes('?') ? '&' : '?';
              return `${newPath}${separator}token=${env.FINNHUB_API_KEY || ''}`;
            },
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
