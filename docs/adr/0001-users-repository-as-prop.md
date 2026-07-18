# UsersRepository is delivered through React context, instantiated at the composition root

The users data source sits behind a `UsersRepository` interface, with `HttpUsersRepository` as the production adapter and `FakeUsersRepository` as the in-process fake. `main.tsx` is the composition root that instantiates the adapter; `RepositoriesProvider` delivers it to the tree; `useRepositories()` is the single read site.

We rejected:

- a custom hook (`useUsers()`) — would have bundled the data-source seam with the fetch-lifecycle seam (now owned by TanStack Query in a separate decision).
- a module-level singleton — would have replaced the network-in-view problem with a globally-imported network that tests can't avoid.
- prop-drilling through `App` — the original draft proposed this, but as the codebase grew past one feature, tree-wide providers compose better than prop chains, and tests of a single feature wrap with `RepositoriesProvider` without mocking the whole composition.

Two adapters justify the seam at exactly the threshold — provided the Fake is exercised by at least one test, otherwise the seam is hypothetical (per the codebase-design principle that one adapter means a hypothetical seam and two adapters mean a real one).
