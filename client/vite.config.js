import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: ["peminjaman.cimaragas-pangatikan.id"],
    proxy: {
      "/api": {
        target: "http://localhost:5000", // Ganti 'server' dengan nama service backend di docker-compose
        changeOrigin: true,
        secure: false,
      },
      //port: 5173,
      // proxy: {
      //   '/api': 'http://localhost:5000'
      // }
    },
  },
});
