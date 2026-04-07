import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 600, // optional: raises the warning threshold
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("react-icons")) {
            return "react-icons"; // splits it into its own chunk
          }
          if (id.includes("node_modules")) {
            return "vendor"; // everything else in node_modules → vendor chunk
          }
        },
      },
    },
  },
});