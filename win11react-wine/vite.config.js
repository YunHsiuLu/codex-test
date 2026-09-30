import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: "./",
  clearScreen: false,
  server: { host: "127.0.0.1", port: 1420, strictPort: true },
  define: { "process.env.NODE_ENV": JSON.stringify(mode) },
  build: { outDir: "build", target: "safari15" },
}));
