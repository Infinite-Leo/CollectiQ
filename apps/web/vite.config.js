import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    base: './',
    envDir: '../../',
    plugins: [react()],
    server: {
        port: 3000,
        host: true,
        allowedHosts: 'all',
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
});
