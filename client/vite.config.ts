import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Determina l'URL dell'API in base all'ambiente
const apiUrl = process.env.NODE_ENV === 'production' 
  ? 'https://web-production-868a0.up.railway.app' 
  : 'http://localhost:5000';

export default defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared")
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: apiUrl,
        changeOrigin: true,
      }
    }
  },
  define: {
    // Rendi disponibile l'URL dell'API all'applicazione
    'import.meta.env.VITE_API_URL': JSON.stringify(`${apiUrl}/api`)
  }
});
