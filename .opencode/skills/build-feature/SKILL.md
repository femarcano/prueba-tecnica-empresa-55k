# build-feature

Scaffold a new feature folder under `src/features/<name>/` that follows the same role layout as `src/features/UserList/`. One skill, one job: keep every feature folder shaped the same way so the next reader (human or agent) finds `logics/schema/`, `hooks/`, `presentations/`, and `index.tsx` where they expect them.

## When to use

You are about to build a new feature for this React + TypeScript + TanStack Query app and need a folder. Run this skill before writing a single file. **Don't** read the existing `UserList/` for "inspiration" — read it to confirm the convention; copy the structure, then write fresh code for your feature's domain.

## Steps

### 1. Scaffold the role tree

Each folder is a **role** — a place where one kind of code lives, named for what it produces.

```
src/features/<feature>/
  index.tsx                     # composition entry — wires hook into presentation
  hooks/
    index.ts                    # the public hook for the feature
    <useCase>/                  # one folder per stateful concern
      index.ts
  logics/
    index.ts                    # barrel — re-exports ./schema
    schema/
      index.ts                  # Zod schemas, inferred types
  presentations/
    index.tsx                   # the main view — receives everything via props
    <ChildComponent>/           # one folder per sub-component of the view
      index.tsx
```

Folder name: **camelCase, singular noun** matching the domain term (`users`, `orders`, `invoices`). Pluralise only if the domain already uses the plural (`users` stays plural because the term is *the Users Directory*).

Completion: `ls -R src/features/<feature>/` shows every entry above; `logics/index.ts` contains `export * from "./schema";`.

### 2. Schemas are the type source

Zod is the single source of truth for domain types in this codebase. TypeScript types are **inferred** via `z.infer` — never hand-written alongside schemas.

```ts
import { z } from "zod";

export const nameSchema = z.object({ /* ... */ });
export type Name = z.infer<typeof nameSchema>;

export const userSchema = z.object({
  name: nameSchema,         // compose by name, don't inline
  // ...
});
export type User = z.infer<typeof userSchema>;
```

**Rules**
- One schema per noun (`userSchema`, `orderSchema`).
- Compose sub-schemas by reference (`name: nameSchema`), not by inlining.
- `export type` the inferred type alongside its schema.
- Do **not** create a `src/types/<feature>.ts` file. The feature owns its types via `logics/schema/`. If another module needs the type, import from `../features/<feature>/logics` (this is the documented layering — see ADR-0002).

Completion: every noun the feature exposes has a `<noun>Schema` and a derived `<Noun>` type.

### 3. Hooks own stateful behaviour, accept their dependencies

A hook wraps Query, mutations, refs, and any state that survives across renders. Pure derivations (filter, sort) stay in `presentations/`.

```ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { UsersRepository } from "../../../repositories/usersRepository";
import type { User } from "../logics";

export const useGetUsers = (repository: UsersRepository) => {
  const queryClient = useQueryClient();
  const { data: users = null, isLoading, error } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => repository.getUsers(),
  });
  // mutations go through queryClient.setQueryData, not local useState
  return { users, isLoading, error, /* actions */ };
};
```

**Rules**
- One public hook per feature (`useUserList`). Sub-hooks go in their own folders (`hooks/useGetUsers/`).
- **Accept repositories as parameters.** Never `new HttpUsersRepository()` inside a hook — that's the singleton pattern ADR-0001 explicitly rejected. The composition root in `main.tsx` instantiates the adapter.
- Mutations use `queryClient.setQueryData` or `useMutation`. Local `useState` is for view state only.
- The public hook returns a single object — typically `{ state, actions }` — so the composition entry destructures once.

Completion: no `import { HttpXxxRepository }` from inside any hook file; every hook that talks to data takes its adapter as a parameter.

### 4. Presentation is pure, receives everything via props

The presentation owns **view state** (filters, sort flags, modal visibility) and the JSX. It reads nothing from Query or repositories. It does not call other hooks except for `useState`/`useMemo`/`useCallback`.

**Rules**
- Props are passed from `index.tsx`, which is the only file that knows about both hooks and presentation.
- Sub-components of the view (e.g. the table inside the page) live in their own folders under `presentations/` (`presentations/<ChildName>/index.tsx`) and take only their own props.
- Loading and error branches are explicit (`{isLoading && ...}`, `{error && ...}`) — do not collapse them into the main view.
- Children from `src/components/` (shared library) are imported; feature-specific UI is not.

Completion: removing every `useState`/`useMemo`/`useRef` call from the presentation leaves the JSX syntactically identical (handlers may break, but the structure is unchanged).

### 5. Composition entry in `index.tsx`

`index.tsx` is the **only file that knows about every role**. It wires the public hook (stateful) into the presentation (view) and accepts the repository from `App`.

```tsx
import { useUserList } from "./hooks";
import { UserListPresentation } from "./presentations";
import type { UsersRepository } from "../../repositories/usersRepository";

interface UserListProps { repository: UsersRepository }

export const UserList = ({ repository }: UserListProps) => {
  const { state, actions } = useUserList(repository);
  return <UserListPresentation {...state} {...actions} />;
};
```

Completion: rendering `<UserList repository={fakeRepo} />` standalone shows the full UI with empty initial state.

### 6. Wire the composition root in `main.tsx`

```tsx
import { HttpUsersRepository } from "./repositories/usersRepository";

const repository = new HttpUsersRepository();

<App repository={repository} />
```

`main.tsx` is the **only** file that names a concrete adapter. Tests render `<App repository={new FakeUsersRepository()} />` instead. The feature folder never references a concrete adapter class.

Completion: `pnpm build` passes with zero TS errors.

## Anti-patterns (caught at review time)

- **`new HttpXxxRepository()` inside a hook.** The singleton pattern. ADR-0001 rejects it.
- **`interface User {}` next to `userSchema`.** Pick one — schema wins.
- **A `src/types/<feature>.ts` file.** Types belong in the feature's `logics/schema/`.
- **A `components/` folder inside the feature.** Use `src/components/` for shared UI; put feature-only UI under `presentations/`.
- **Presentation importing `useQuery` or `useMutation`.** Query is owned by hooks and `index.tsx`. Presentation is pure.
- **A presentation prop list over ~8 fields.** If the presentation needs more, lift the derivation into the hook (it owns stateful behaviour, derivations that depend on data are its job) or split the view into sub-components that take narrower props.

## The existing anchor

`src/features/UserList/` is the canonical example. Read it before scaffolding a new feature — its role layout is the contract this skill enforces. ADR-0001 and ADR-0002 record the seam and layering decisions behind it.

## Worked example

For a complete, minimal feature that mirrors this layout (no `UserList/`-specific code), see [`samples/orders.md`](./samples/orders.md). It walks through every file in the role tree with realistic code, then applies the deletion test to each role so you can see what earns its place.