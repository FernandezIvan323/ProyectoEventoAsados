import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const landingDir = path.resolve(__dirname, '../landing')

function landingPagePlugin() {
  return {
    name: 'landing-page',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '/'

        // Let Vite handle its own internals and the React app
        if (url.startsWith('/app/') || url === '/app' || url.startsWith('/@') || url.startsWith('/src') || url.startsWith('/node_modules') || url.startsWith('/favicon')) {
          return next()
        }

        // Map URL to file in landing directory
        const file = url === '/' ? 'index.html' : url.slice(1)
        const filePath = path.join(landingDir, file)

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath)
          const types = {
            '.html': 'text/html; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.svg': 'image/svg+xml',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.ico': 'image/x-icon',
          }
          res.setHeader('Content-Type', types[ext] || 'application/octet-stream')
          res.end(fs.readFileSync(filePath))
          return
        }

        // Fallback: serve landing index.html (for deep links on the landing)
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(fs.readFileSync(path.join(landingDir, 'index.html')))
      })
    },
  }
}

export default defineConfig({
  base: '/app/',
  plugins: [react(), tailwindcss(), landingPagePlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    watch: {
      usePolling: true,
      ignored: ['**/OneDrive/**', '**/Documents/**', '**/node_modules/.vite/**'],
    },
  },
  optimizeDeps: {
    entries: ['./index.html'],
  },
})
