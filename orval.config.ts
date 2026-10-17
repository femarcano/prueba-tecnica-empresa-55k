import { defineConfig } from "orval";

export default defineConfig({
  randomuser: {
    input: {
      target: "./openapi.yaml",
    },
    output: {
      mode: "split",
      client: "fetch",
      httpClient: "fetch",
      target: "./src/apis/__generated__/client/randomuser.ts",
      schemas: "./src/apis/__generated__/client/schemas",
      clean: true,
      baseUrl: "https://randomuser.me",
      mock: false,
    },
  },
  randomuserZod: {
    input: {
      target: "./openapi.yaml",
    },
    output: {
      mode: "single",
      client: "zod",
      target: "./src/apis/__generated__/zod",
      clean: true,
      override: {
        zod: {
          variant: "classic",
          version: "auto",
        },
      },
    },
  },
});
