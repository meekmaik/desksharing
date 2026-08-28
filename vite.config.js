import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Für GitHub Pages: Basis-Pfad = "/desksharing/" (muss exakt dem Repo-Namen entsprechen)
export default defineConfig({
  base: '/desksharing/',
  plugins: [react()],
})
