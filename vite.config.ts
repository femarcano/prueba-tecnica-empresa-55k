import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const r = (p: string) => resolve(fileURLToPath(new URL(".", import.meta.url)), p);

export const aliases = [
  { find: "@", replacement: r("src") },
  { find: "@/assets", replacement: r("src/assets") },
  { find: "@/features", replacement: r("src/features") },
  { find: "@/repositories", replacement: r("src/repositories") },
  { find: "@/types", replacement: r("src/types") },
  { find: "@/utils", replacement: r("src/utils") },
];

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: aliases,
  },
});
