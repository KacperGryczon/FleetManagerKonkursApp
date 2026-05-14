import { defineConfig } from "vite";

export default defineConfig({
  // Vite will automatically load .env file
  // and inject VITE_* prefixed variables
  server: {
    port: 5173,
    open: true,
  },
});
