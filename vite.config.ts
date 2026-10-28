import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  resolve: {
    dedupe: ["three", "web-ifc"],
  },
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
          const norm = id.replace(/\\/g, "/");
          if (norm.includes("node_modules/three") || norm.includes("node_modules/camera-controls")) {
            return "three-vendor";
          }
          if (norm.includes("node_modules/web-ifc")) {
            return "web-ifc-vendor";
          }
          if (norm.includes("node_modules/@thatopen/ui") || norm.includes("node_modules/@thatopen/ui-obc")) {
            return "thatopen-ui";
          }
          if (norm.includes("node_modules/@thatopen")) {
            return "thatopen-core";
          }
        },
      },
    },
  },
});
