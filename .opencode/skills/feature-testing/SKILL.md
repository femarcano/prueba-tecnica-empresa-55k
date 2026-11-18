---
name: feature-testing
description: How to write a test in this repository — where the file goes, how the upstream is stubbed, how the DOM is queried, and what each layer's test should and should not assert. Use when writing or changing any `*.test.ts` or `*.test.tsx` file.
---

# feature-testing

This repository has no MSW, no `user-event`, and no global test cleanup. Its tests are plain Vitest with `@testing-library/react`, and they stub the network at the `fetch` boundary. The conventions below are what the existing five test files do — follow them.

## The configuration, and what it implies

```ts
// vitest.config.ts
test: {
  css: false,
  environment: "happy-dom",
  globals: false,
  include: ["src/**/*.{test,spec}.{ts,tsx}"],
}
```

Three consequences:

- **`globals: false`** — every test file imports `describe`, `it`, `expect`, `vi`, `afterEach` from `vitest` explicitly. There is no global `describe`.
- **No `setupFiles`** — there is no `vitest.setup.ts`, and no automatic `cleanup()`.
- **`happy-dom`** — the DOM is a simulation. `open` is not attached to `<dialog>`, and a few browser APIs are absent.

## Where the file goes

Next to the file it tests, named after it:

```
src/apis/usersCache/fetchUsers.ts       → src/apis/usersCache/fetchUsers.test.ts
src/apis/usersCache/index.ts            → src/apis/usersCache/index.test.ts
src/features/UserList/hooks/useGetUsers/index.ts
                                         → src/features/UserList/hooks/useGetUsers/index.test.tsx
src/features/UserList/index.tsx         → src/features/UserList/index.test.tsx
```

The test imports its target relatively, from the same directory:

```ts
import { fetchUsers } from "./fetchUsers";
import { makeUsersCache } from "./index";
import { UserList } from "./index";
```

**A test file for a feature's entry point is the feature's integration test.** It renders the whole feature and asserts on what the user sees. That is the canonical test for a feature — see `src/features/UserList/index.test.tsx`.

## Which layer owns which test

| The code under test | What to write |
|---|---|
| A pure function — a `logics/` module, a converter, a generator, a schema | A **unit test**: call it directly, assert on the return value |
| The data source (`fetchUsers`) | A **unit test** with `fetch` stubbed |
| The Query cache (`makeUsersCache`) | A **unit test** with a real `QueryClient` and `fetch` stubbed |
| A hook that wraps a query (`useGetUsers`) | A **unit test** with `renderHook`, a `QueryClientProvider` and a `Suspense` wrapper |
| The feature as a whole (`index.tsx`) | An **integration test**: render the feature, assert on the DOM |

**Prefer the cheapest layer that can observe the behaviour.** A unit test is faster and more precise than an integration test. Reach for the integration test when the behaviour is only visible on screen — what is rendered, in what order, and what happens when the user acts.

**Do not pile input/output patterns into the integration test.** Exhaustive coverage of a pure function's branches belongs in that function's own unit test, not in the feature's integration test. The integration test covers the representative case: that the behaviour is reachable and visible.

## Naming

```ts
describe("fetchUsers", () => {
  it("returns parsed User[] when the payload is valid", async () => {
```

- **`describe`** is named after the unit under test — the function, the hook, or the component. The function's name.
- **`it`** states what the test asserts, in the present tense, as a sentence: *"returns parsed User[] when the payload is valid"*, *"filters the user with the matching uuid out of the cache"*, *"narrows the rows to the users of the filtered country"*.
- **Name the condition, not the mechanics.** *"throws a ZodError when a user field has the wrong shape"* says what happened; *"calls expect(...).rejects"* says nothing about the behaviour.
- **Group by concern** with nested `describe` when a unit has several methods — `describe("makeUsersCache")` containing `describe("query")`, `describe("remove")`, `describe("reset")`.
- The names in this repository are **in English**. Write them in English.

## Stubbing the upstream

The network is stubbed at the `fetch` boundary (`CONTEXT.md`'s `Fake` entry). **The real code under test runs** — only its network input is replaced.

```ts
function payload(users: unknown[]) {
  return {
    results: users,
    info: { seed: "abc", results: users.length, page: 1, version: "1.4" },
  };
}

function fetchResponse(status: number, body: unknown) {
  return {
    status,
    text: async () => JSON.stringify(body),
    headers: new Headers(),
  };
}

vi.stubGlobal(
  "fetch",
  vi.fn(async () => fetchResponse(200, payload([validUser()]))),
);
```

That is the shape from `src/apis/usersCache/fetchUsers.test.ts`. Note it is a plain object, not a real `Response` — the generated client only reads `status`, `text` and `headers`.

**Unstub after every test:**

```ts
afterEach(() => {
  vi.unstubAllGlobals();
});
```

**Do not mock the module under test.** There is not a single `vi.mock` in this repository's tests. `vi.mock("@/apis/usersCache")` would skip the parsing and the status handling — exactly what the test should cover.

## Rendering a component

```tsx
function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<p>Loading users…</p>}>{children}</Suspense>
    </QueryClientProvider>
  );
}

render(<UserList />, { wrapper: makeWrapper() });
```

- `retry: false` so a failure is not retried and the test does not hang.
- The `Suspense` boundary is required when the tree suspends — the feature's hook uses `useSuspenseQuery`.
- `QueryClientProvider` is required for any tree that uses a query.

**Call `cleanup()` yourself.** There is no global cleanup in this repository's Vitest configuration, so each `render` stays in the document and the next test's queries would see the previous test's rows.

```tsx
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
```

## Querying the DOM

Use the **role** queries, in this order of preference: `getByRole`, `getByLabelText`, `getByPlaceholderText`, `getByText`. They assert on what a user perceives, so they survive a refactor of the markup.

```tsx
await waitFor(() => {
  expect(renderedRows()).toHaveLength(3);
});

expect(screen.getByText("alice@example.com")).toBeTruthy();
expect(screen.queryByText("bob@example.com")).toBeNull();
```

- `getBy*` throws when it finds nothing — use it when the element must be there.
- `queryBy*` returns `null` — use it to assert that something is **gone**.
- `findBy*` returns a promise — use it instead of `waitFor` when waiting for one element.

**Scope the query to the element under test.** `screen` searches the whole document, so with several tables it would match rows from all of them:

```tsx
function renderedRows() {
  const table = screen.getByRole("table");
  return within(table).getAllByRole("row").slice(1);
}
```

**Do not use `data-testid` on an element that has a role.** The role query is the better assertion, and the two together mean two ways for the test to break.

## Acting on the DOM

`@testing-library/user-event` is **not installed**. Use `fireEvent` from `@testing-library/react`:

```tsx
fireEvent.change(screen.getByPlaceholderText("Filter by Country"), {
  target: { value: "Canada" },
});

fireEvent.click(screen.getByRole("button", { name: "sort by country" }));
```

`fireEvent` is less faithful than `user-event` — it dispatches the event directly rather than simulating the full interaction. That is a known limitation of this repository's test setup, not something to work around by installing a package.

## Regression tests

A test that reproduces a fixed defect earns a comment explaining what it protects:

```ts
// Regression: the upstream emits a distinct name.title per locale. The
// enum in openapi.yaml used to omit "Monsieur", which the API returns
// for French-speaking users. One such user in a payload of 100 made
// the whole parse throw, so the table rendered nothing at all.
it("accepts a payload where one user has the Monsieur title", async () => {
```

That comment is the test's reason to exist. Without it, the next person to see an odd-looking fixture has no idea whether it is load-bearing.

## Before the implementation exists

When a test is written **before** the code it tests, the test cannot pass. Mark it with `it.skip` and hand it over:

```ts
it.skip("narrows the rows to the users of the filtered country", async () => {
```

**The implementer removes the skip** once the code exists and the test passes. A skipped test that is never unskipped is a test that does not run, so the handover has to say which files carry skips.

A test that imports a module that does not exist yet fails to load. That is expected — the file still gets committed with its skips, and it becomes valid once the module is there.

## The check

```console
$ pnpm test
 Test Files  5 passed (5)
      Tests  36 passed (36)
```

Run one file while you work on it:

```console
$ pnpm exec vitest run src/features/UserList/index.test.tsx
```

The path argument is a partial match, so a fragment can match more than one file. Pass enough of the path to identify the target uniquely.

## Anti-patterns

| Anti-pattern | Why it is wrong |
|---|---|
| `vi.mock("@/apis/usersCache")` | It skips the parsing and the status handling — the parts worth testing. Stub `fetch`. |
| `vi.mock` of the module under test | The test then asserts against the mock, not the behaviour. |
| `data-testid` on an element with a role | Two ways for the test to break; the role query is the better assertion. |
| Omitting `cleanup()` in a DOM test | The renders accumulate, and the next test's queries see the previous test's rows. |
| `screen.getByText(...)` without scoping, with several of the same | It matches the first one in the document, which may be the wrong one. |
| `expect(user.location.country).toBe("Canada")` on the raw API object | It asserts on the upstream's shape, not on what the user sees. Assert on the rendered row. |
| A snapshot of the whole page | It fails on every unrelated change and nobody reads the diff. |
| A test name that describes the mechanics | *"calls expect(...).rejects"* says nothing. Say what happens. |
| `it.skip` left in place after the implementation lands | The test does not run. The implementer removes the skip. |
| Installing `user-event` to write one test | A dependency change is a bigger decision than a test. `fireEvent` is what this repository uses. |

## Completion criteria

- The file sits next to the code it tests and is named `*.test.ts` / `*.test.tsx`.
- It imports `describe` / `it` / `expect` / `vi` from `vitest` — this repository has `globals: false`.
- The upstream is stubbed with `vi.stubGlobal("fetch", …)` and unstubbed in `afterEach`.
- A DOM test calls `cleanup()` in `afterEach`.
- Queries use roles, not `data-testid`.
- The names state what the behaviour is, in English.
- The test asserts on behaviour, not on the implementation's structure.
- A test written before the implementation exists carries `it.skip`, and the handover says which.

## Related skills

- `feature-container` — the role whose integration test this is.
- `feature-hook` — the role whose unit test this is.
- `feature-api-hook` — the data source whose unit test this is.
- `feature-logics` — the pure functions whose unit tests this is.
