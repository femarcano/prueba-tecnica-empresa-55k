import { defineConfig, globalIgnores } from "@eslint/config-helpers";

export default defineConfig([
  globalIgnores([
    "logs",
    "*.log",
    "npm-debug.log*",
    "yarn-debug.log*",
    "yarn-error.log*",
    "pnpm-debug.log*",
    "lerna-debug.log*",
    "node_modules",
    "dist",
    "dist-ssr",
    "*.local",
    ".vscode/*",
    "!.vscode/extensions.json",
    ".idea",
    ".DS_Store",
    "*.suo",
    "*.ntvs*",
    "*.njsproj",
    "*.sln",
    "*.sw?",
  ]),
  {
    rules: {
      "@typescript-eslint/explicit-function-return-type": 0,
      "react/react-in-jsx-scope": 0,
    },
  },
]);
