import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        },
    },
    server: {
        host: '0.0.0.0',
        port: 8080,
        strictPort: false
    },
    preview: {
        host: '0.0.0.0',
        port: 8080,
        strictPort: false
    }
});
