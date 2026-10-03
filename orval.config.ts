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
      target: "./src/repositories/__generated__/client/randomuser.ts",
      schemas: "./src/repositories/__generated__/client/schemas",
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
      target: "./src/repositories/__generated__/zod",
      clean: true,
      override: {
        zod: {
          variant: "regular",
          version: "auto",
        },
      },
    },
  },
});