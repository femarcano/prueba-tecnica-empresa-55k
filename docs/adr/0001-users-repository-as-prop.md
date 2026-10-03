# HttpUsersRepository is gone; fetchUsers is the data source

The users data source has no seam. There is one adapter (`HttpUsersRepository` was deleted along with `src/repositories/`), and feature code calls `fetchUsers` (in `src/apis/usersCache/fetchUsers.ts`) directly. Tests stub `globalThis.fetch`.

We rejected:

- keeping `HttpUsersRepository` as a class wrapping `getRandomUsers` — it added a layer that only delegated. The orval client already produces typed responses and throws on non-2xx via fetch. The wrapper existed only to enforce Zod validation and rethrow with a status-code message; that 5-line contract is now `fetchUsers.ts`.
- keeping a `UsersRepository` interface for hypothetical future adapters — ADR-0002 notes the "two adapters justify the seam" rule. Without a second adapter, the interface has no implementations and the rule fires in reverse: a hypothetical seam is worse than no seam.

When a second adapter joins (e.g. an in-memory cache for offline mode, or a server-side backed), reintroduce the interface at that threshold — not before.