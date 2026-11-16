---
name: feature-api-hook
description: How a feature hook imports and calls the API layer of this repository — `src/apis/usersCache/`. It covers the query key, the Query cache factory, the data-source function, and the generated client that owns the upstream payload shape. Use when a feature hook has to read from or mutate the upstream API.
---

# feature-api-hook

This skill covers the **import side** of the API: how a feature hook reaches the data, and what it may and may not do with it.

## Where the API layer lives

```
src/apis/
  keys/index.ts               # the query key
  usersCache/
    fetchUsers.ts             # the single data-source function
    index.ts                  # the Query cache factory
  __generated__/              # orval output — never hand-edited
```

`src/apis/usersCache/fetchUsers.ts` is the single data-source function for the users list (ADR-0001). There is no module wrapping it and no interface around it.

## Importing the data

A feature hook imports the cache factory and builds a Query from it:

```ts
// src/features/UserList/hooks/useGetUsers/index.ts
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { makeUsersCache } from "@/apis/usersCache";

export const useGetUsers = () => {
  const queryClient = useQueryClient();
  const cache = useMemo(() => makeUsersCache(queryClient), [queryClient]);

  const { data: users } = useSuspenseQuery(cache.query());

  return {
    onDelete: cache.remove,
    onReset: cache.reset,
    users,
  };
};
```

Note the import path: `@/apis/usersCache` — the barrel, not the file inside it. `src/apis/usersCache/index.ts` re-exports `User` and the factory:

```ts
import { queryOptions, type QueryClient } from "@tanstack/react-query";

import { GET_USERS_KEY } from "@/apis/keys";

import { fetchUsers, type User } from "./fetchUsers";

export type { User };

export function makeUsersCache(queryClient: QueryClient) {
  return {
    query() {
      return queryOptions({
        queryFn: fetchUsers,
        queryKey: GET_USERS_KEY,
        staleTime: 1000 * 60 * 5,
      });
    },
    remove(uuid: string): void {
      queryClient.setQueryData<User[]>(GET_USERS_KEY, (old) =>
        old ? old.filter((user) => user.login.uuid !== uuid) : old,
      );
    },
    reset(): void {
      queryClient.invalidateQueries({ queryKey: GET_USERS_KEY });
    },
  };
}
```

## The four pieces

| Piece | Where | What it is |
|---|---|---|
| **The query key** | `src/apis/keys/index.ts` | `export const GET_USERS_KEY = ["users"] as const;` — the cache identity. Every read and every write uses the same key. |
| **The data source** | `src/apis/usersCache/fetchUsers.ts` | The one function that calls the upstream API and parses the response. |
| **The cache factory** | `src/apis/usersCache/index.ts` | `makeUsersCache(queryClient)` — the Query options, and the mutations that write to the cache. |
| **The generated client** | `src/apis/__generated__/` | The typed client and the Zod schema, both produced by orval from `openapi.yaml`. |

## Rules

- **Call `fetchUsers` through the cache, never directly from a feature.** The feature hook calls `cache.query()`; the cache owns the key, the stale time, and the query function. Calling `fetchUsers` from a feature would bypass the cache and every mutation of it.
- **The query key is the cache's, not the feature's.** The feature never writes `GET_USERS_KEY` itself. If a feature needs a different slice of the same data, that is a change to `src/apis/`, not to the feature.
- **Mutations go through the cache's methods** — `cache.remove(uuid)` writes with `setQueryData`, `cache.reset()` invalidates. The feature never calls `queryClient.setQueryData` with the key itself; that would duplicate the key in two places.
- **The payload shape is owned by `openapi.yaml`.** `src/apis/__generated__/client/randomuser.ts` and `src/apis/__generated__/zod/randomuserMe.ts` are produced by orval. Never hand-write the payload shape and never edit the generated files — change `openapi.yaml` and run `pnpm orval` (ADR-0002).
- **The `User` type comes from the generated schema**, not from the feature:

  ```ts
  export type User = z.infer<typeof GetRandomUsersResponse>["results"][number];
  ```

  A feature that needs the type imports it from `@/apis/usersCache`. It does not declare its own `User` interface, and it does not create `src/types/user.ts`.
- **No repository, adapter, or service.** There is one adapter, so the seam does not exist. Introducing an interface for a hypothetical second implementation is the mistake ADR-0001 explicitly rejects. When a second adapter joins — an in-memory cache for offline mode, a server-side backed one — the interface is introduced at that threshold.
- **The data source throws on a non-200.** `fetchUsers` raises `Error(\`randomuser.me API returned ${response.status}\`)` for any other status. The error reaches the `ErrorBoundary` above the feature in `src/App.tsx`.

## Testing the import

Tests stub the network at the boundary, not the API layer (ADR-0001, and `CONTEXT.md`'s `Fake` entry):

```ts
vi.stubGlobal(
  "fetch",
  vi.fn(async () => ({
    status: 200,
    text: async () => JSON.stringify(payload([user()])),
    headers: new Headers(),
  })),
);
```

The real `fetchUsers` runs in the test environment; only its network input is replaced. Do not mock `@/apis/usersCache` — that would skip the parsing and the status handling, which are exactly what the test should cover.

## When the API layer needs to change

The feature does not own it. If a feature needs data the upstream does not return, or a shape the contract does not model:

1. Change `openapi.yaml`.
2. Run `pnpm orval`.
3. The generated client and schema update.

A feature-level workaround — a hand-written type, an adapter that reshapes the payload — duplicates the contract and will drift from it.

## Anti-patterns

| Anti-pattern | Why it is wrong |
|---|---|
| `useSuspenseQuery({ queryFn: fetchUsers, queryKey: ["users"] })` in a feature | The key and the stale time belong to the cache. Duplicating them in two places is how they drift. |
| `queryClient.setQueryData(GET_USERS_KEY, …)` in a feature | The cache owns the mutation. The feature calls `cache.remove`. |
| `interface User { … }` in a feature | The type comes from the generated schema via `z.infer`. |
| Editing `src/apis/__generated__/` | It is generated output. Change `openapi.yaml` and run `pnpm orval`. |
| `vi.mock("@/apis/usersCache")` | It skips the parsing and the status handling. Stub `fetch` instead. |
| A `UsersRepository` interface | There is one adapter. The seam does not exist yet (ADR-0001). |
| Importing from `@/apis/usersCache/fetchUsers` directly | The barrel is the public surface of the API layer. |

## Completion criteria

- The feature hook imports from `@/apis/usersCache`, not from a file inside it.
- The query goes through `cache.query()`; the mutations go through `cache.remove` / `cache.reset`.
- No query key is written in the feature.
- The `User` type is imported, never re-declared.
- Nothing under `src/apis/__generated__/` was edited; `openapi.yaml` is the only place the contract lives.
- No repository or adapter was introduced.

## Related skills

- `feature-hook` — the role that calls the API layer.
- `feature-logics` — where a transformation of the API response belongs.
- `build-feature` — the role tree the hook sits in.
