import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    https: (() => {
      const certDir = path.resolve(__dirname, "certs");
      const cert = path.join(certDir, "dev.pem");
      const key = path.join(certDir, "dev-key.pem");
      if (fs.existsSync(cert) && fs.existsSync(key)) {
        return {
          cert: fs.readFileSync(cert),
          key: fs.readFileSync(key),
        };
      }
      return undefined;
    })(),
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
