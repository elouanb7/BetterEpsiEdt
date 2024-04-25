import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    base: './', // Specify the base path
    build: {
        outDir: 'dist', // Output directory
        assetsDir: 'assets', // Assets directory (no leading slash)
        // Optionally configure the public path if needed
        publicDir: './',
    },
    preview: {
        host: 'localhost',
        port: 5173,
        strictPort: true,
        proxy: 'https://edtmobiliteng.wigorservices.net',
    },
    server: {
        proxy: {
            '/edt': {
                target: 'https://elouanb7.github.io/BetterEpsiEdt/',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/edt/, '')
            }
        }
    }
})
