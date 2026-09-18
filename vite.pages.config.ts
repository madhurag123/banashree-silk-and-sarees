import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
const project = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig({
  root: project + "github-pages",
  base: process.env.PAGES_BASE_PATH || "/banashree-silk-and-sarees/",
  publicDir: project + "public",
  plugins: [react()],
  resolve: { alias: { "@": project } },
  css: { postcss: project },
  build: { outDir: project + "docs", emptyOutDir: true },
});
