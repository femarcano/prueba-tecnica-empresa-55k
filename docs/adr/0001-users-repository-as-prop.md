# HttpUsersRepository is module-instantiated; tests stub fetch

`HttpUsersRepository` is the production adapter for the users data source. It is instantiated once at module load inside `useGetUsers` (`src/features/UserList/hooks/useGetUsers/index.ts`), and the hook composes a `usersCache` around it. There is no provider, no context, and no second adapter.

We rejected:

- **a `RepositoriesProvider` + `useRepositories()` context** — the seam had one binding site and one consumer, and the consumer re-built the `usersCache` on every render. The context added plumbing without making a second adapter easier to test against.
- **a `FakeUsersRepository` test fixture** — `useGetUsers` tests stub `globalThis.fetch` instead. `usersRepository.test.ts` exercises `HttpUsersRepository` directly. Two adapters had justified a context seam, but with fetch stubbing one adapter is enough.

Tests stub `fetch` via `vi.stubGlobal("fetch", ...)` and let `HttpUsersRepository` make its real call, which catches URL and query-string regressions that a fake would not. When the data source joins a second adapter (e.g. an in-memory cache for offline mode), reintroduce the seam at that threshold — not before.