// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),        // Enables React support (JSX/TSX)
    tailwindcss(),  // Enables TailwindCSS integration
  ],
  server: {
    host: "0.0.0.0", 
    port: 5173,      // Default Vite port
    watch: {
      usePolling: true, // <— needed for Docker on Windows/Mac
    },
  },
});