# User contract is owned by openapi.yaml, materialized by orval

The `User` type and the runtime Zod schema are both generated from `openapi.yaml` via `pnpm orval`. Hand-written code never defines the User shape.

`openapi.yaml` is the single source of truth. `orval.config.ts` describes the two outputs:

- `src/apis/__generated__/client/randomuser.ts` — typed `fetch` client.
- `src/apis/__generated__/zod/randomuserMe.ts` — Zod 4 schema for runtime validation.

`HttpUsersRepository` and `FakeUsersRepository` import `type User` from `./usersRepository`, where it is re-exported as `z.infer<typeof GetRandomUsersResponse.shape.results>[number]`. Consumers in `apis/usersCache` import it from the same module.

We rejected the previous hand-rolled `userSchema` in `src/features/UserList/logics/schema/` because the upstream contract is `randomuser.me`, not the feature — hand-writing the schema put the contract definition in two and drifted. Generating from an OpenAPI spec ties the contract to one document.

The OpenAPI spec lives at the repo root (`openapi.yaml`) rather than next to the repository because it describes an external service, not our application code.