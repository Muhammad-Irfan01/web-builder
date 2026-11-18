import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [reactRouter()],
  resolve: {
    alias: {
      "~": "/app",
    },
  },
  server: {
    host: true,
    port: 3031,
    open: false,
  },
});
