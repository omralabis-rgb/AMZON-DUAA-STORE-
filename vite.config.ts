import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // 1. Core React ecosystem - strictly isolated to maintain React singleton and robust Suspense resolution
              if (
                id.includes('/node_modules/react/') ||
                id.includes('/node_modules/react-dom/') ||
                id.includes('/node_modules/scheduler/')
              ) {
                return 'vendor-react';
              }

              // 2. Firebase client ecosystem
              if (id.includes('/node_modules/firebase/') || id.includes('/node_modules/@firebase/')) {
                return 'vendor-firebase';
              }

              // 3. Mapping and geospatial visualizations
              if (
                id.includes('react-simple-maps') ||
                id.includes('/node_modules/d3-') ||
                id.includes('topojson')
              ) {
                return 'vendor-maps';
              }

              // 4. UI Icon set
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }

              // 5. Supabase client
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }

              // 6. Animation and remaining third-party runtime libraries
              return 'vendor-libs';
            }

            // Group heavy administrative studio and form tools to prevent fragmented micro-chunks
            if (
              id.includes('/src/components/AdminProductForm') ||
              id.includes('/src/components/AdminDeveloperAdvisor') ||
              id.includes('/src/components/AdminCopilotModal') ||
              id.includes('/src/components/AIVideoStudio')
            ) {
              return 'admin-bundle';
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

