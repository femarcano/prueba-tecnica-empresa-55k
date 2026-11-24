# Randomuser contract is owned by `openapi.yaml`, materialized by orval

The upstream randomuser.me API is described in `openapi.yaml` at the repo root. The spec is the single source of truth; `orval` produces both the typed `fetch` client (`src/apis/__generated__/client/randomuser.ts`) and the runtime Zod schema (`src/apis/__generated__/zod/randomuserMe.ts`) from it. Hand-written code never defines the randomuser payload shape — it consumes the generated artifacts.

`orval.config.ts` describes the two outputs. Generated files are gitignored (see `chore/orval-tooling`); regenerate them with `pnpm orval`.

The OpenAPI spec lives at the repo root rather than next to a feature because it describes an external service, not our application code.

> The original version of this ADR argued the _UserList feature_ should own the schema and the repository should depend on the feature. With codegen, the contract is owned by the OpenAPI document and any consumer depends on the generated surface instead. The "lift only when a second feature needs the type" guard becomes "lift only when the contract grows beyond randomuser".
