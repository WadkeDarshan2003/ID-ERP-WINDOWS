import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        electron({
          main: {
            // Shortcut of `build.lib.entry`.
            entry: 'electron/main.ts',
          },
          preload: {
            // Shortcut of `build.rollupOptions.input`.
            // Preload scripts may contain Web assets, so use `build.rollupOptions.input` instead `build.lib.entry`.
            input: path.join(__dirname, 'electron/preload.ts'),
          },
          // Ployfill the Electron and Node.js built-in modules for Renderer process.
          // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
          renderer: {},
        }),
      ],
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
