# User contract is owned by openapi.yaml, materialized by orval

The `User` type and the runtime Zod schema are both generated from `openapi.yaml` via `pnpm orval`. Hand-written code never defines the User shape.

`openapi.yaml` is the single source of truth. `orval.config.ts` describes the two outputs:

- `src/apis/__generated__/client/randomuser.ts` — typed `fetch` client.
- `src/apis/__generated__/zod/randomuserMe.ts` — Zod 4 schema for runtime validation.

`type User` is derived from the generated Zod schema in `src/apis/usersCache/fetchUsers.ts`:

```ts
export type User = z.infer<typeof GetRandomUsersResponse>["results"][number];
```

`fetchUsers` calls the orval client and Zod-parses the response. It is the only consumer of the generated artifacts. Feature code (`useGetUsers`, table headers, presentations) imports `User` from `@/apis/usersCache`.

The OpenAPI spec lives at the repo root (`openapi.yaml`) rather than next to a feature because it describes an external service, not our application code.