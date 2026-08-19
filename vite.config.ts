import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
  },
  build: {
    target: "esnext",
    chunkSizeWarningLimit: 8000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/three") || id.includes("node_modules/camera-controls")) {
            return "three-vendor";
          }
          if (id.includes("node_modules/@thatopen/ui") || id.includes("node_modules/@thatopen/ui-obc")) {
            return "thatopen-ui";
          }
          if (id.includes("node_modules/@thatopen")) {
            return "thatopen-core";
          }
        },
      },
    },
  },
});
