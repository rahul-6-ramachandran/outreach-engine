import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        host: '127.0.0.1',
        port: 5173,
        proxy: {
            '/auth': {
                target: 'http://127.0.0.1:3000',
                changeOrigin: true,
            },
            '/opportunities': {
                target: 'http://127.0.0.1:3000',
                changeOrigin: true,
            },
            '/outreach': {
                target: 'http://127.0.0.1:3000',
                changeOrigin: true,
            },
            '/api': {
                target: 'http://127.0.0.1:3000',
                changeOrigin: true,
                rewrite: function (path) { return path.replace(/^\/api/, ''); },
            },
        },
    },
});
