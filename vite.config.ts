import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const r = (p: string) => resolve(fileURLToPath(new URL(".", import.meta.url)), p);

const aliases = {
  "@": r("src"),
  "@/assets": r("src/assets"),
  "@/features": r("src/features"),
  "@/repositories": r("src/repositories"),
  "@/types": r("src/types"),
  "@/utils": r("src/utils"),
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: aliases,
  },
  optimizeDeps: {
    rolldownOptions: {
      resolve: {
        alias: aliases,
      },
    },
  },
});
