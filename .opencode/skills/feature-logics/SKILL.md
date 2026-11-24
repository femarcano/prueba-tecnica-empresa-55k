---
name: feature-logics
description: The pure half of a feature — `src/features/<Name>/logics/`. It holds the converters, the generators, the schemas, and the shared constants: everything with no state and no side effects. Use when writing, changing, or reviewing anything under a feature's `logics/`.
---

# feature-logics

`logics/` holds the code that is **pure**: no React, no Query, no network, no state. It takes a value and returns a value. That is what makes it cheap to test and safe to reuse.

## What it owns

```
src/features/<Name>/logics/
  index.ts                    # the barrel
  <functionName>/             # one folder per unit of logic
    index.ts
```

Each folder is named for what it produces:

| Kind             | Folder name                                           | What it does                                                                               |
| ---------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Converter**    | `convertToPresentationProps/`                         | Turns a domain value into the shape the presentation renders                               |
| **Generator**    | `createUserDataTableHeader/`, `generate<Name>Params/` | Builds a value that is handed to something else — a column set, a request body, API params |
| **Schema**       | `schema/`                                             | The Zod schemas, and the types inferred from them                                          |
| **Shared value** | `features/`                                           | A value that more than one role needs, and whose **type** the roles share                  |

`src/features/UserList/logics/` is the canonical example. Read it before writing one.

## The barrel

```ts
// src/features/UserList/logics/index.ts
export { createUserDataTableColumns } from "./createUserDataTableHeader";
export { userListTableFeatures } from "./features";
```

The barrel is what other roles import from: `import { createUserDataTableColumns } from "../logics";`. A role reaches into `logics/<folder>/` only when it needs a type that is not in the barrel.

## Converters

A converter turns a domain value into the props the presentation renders.

```ts
export const convertToPresentationProps = () => {};
```

That is the current state of `src/features/UserList/logics/convertToPresentationProps/index.ts` — the function is a placeholder, because the feature's data reaches the presentation without needing a reshaping step yet.

**A converter earns its place when the transformation has branches.** The rule:

- **Extract** when the API response → presentation props mapping has branches, several fields to reshape, a discriminated union to narrow, or a field the API does not return yet.
- **Do not extract** when there is one usage site and no branches — write the expression in the caller.

A converter that only renames three fields and has no branches is not worth a folder. Extraction adds a file, a type, and an indirection; it pays for itself only when there is logic worth covering with a test.

**Derive the converter's return type from the presentation**, so the two cannot drift:

```ts
import type { UserListPresentation } from "../presentations";

type Converted = React.ComponentProps<typeof UserListPresentation>;
```

Do not declare a converter-specific type. If the presentation's props change, the converter's type changes with it.

## Generators

A generator builds a value that is handed to something else.

```tsx
// src/features/UserList/logics/createUserDataTableHeader/index.tsx
import { type ColumnDef } from "@tanstack/react-table";

import type { User } from "@/apis/usersCache";

import { userListTableFeatures } from "../features";

type Args = {
  onDelete: (uuid: string) => void;
};

type IUserDataTableColumns = (args: Args) => ColumnDef<typeof userListTableFeatures, User>[];

export const createUserDataTableColumns: IUserDataTableColumns = ({ onDelete }) => {
  return [
    {
      accessorKey: "picture.thumbnail",
      cell: ({ row }) => {
        /* ... */
      },
    },
    // ...
  ];
};
```

Rules:

- **The name says what it produces.** `create…` for something it constructs, `generate…` for a request body or API params, `convert…` for a reshaping.
- **The arguments are named.** `type Args = { onDelete: (uuid: string) => void }` — a generator that needs something from the caller takes it as an argument, not by reaching into a React context.
- **A generator may return JSX.** The column definitions contain cells that render `<Avatar>`. A generator is pure, and JSX is pure.
- **A generator that only one role uses may live in that role.** The column definitions are used by the hook, so they live in `logics/`. A generator used by exactly one presentation and nowhere else does not need a folder.

## Schemas

Zod is the single source of truth for domain types. Types are **inferred** with `z.infer`, never hand-written next to a schema.

```ts
import { z } from "zod";

export const nameSchema = z.object({/* ... */});
export type Name = z.infer<typeof nameSchema>;

export const userSchema = z.object({
  name: nameSchema, // compose by reference, do not inline
  // ...
});
export type User = z.infer<typeof userSchema>;
```

Rules:

- **One schema per noun** — `userSchema`, `orderSchema`.
- **Compose sub-schemas by reference** (`name: nameSchema`), not by inlining the object twice.
- **Export the inferred type alongside its schema.**
- **No `src/types/<feature>.ts`.** The feature owns its types through `logics/schema/`. Another module that needs the type imports it from the feature's `logics` barrel (ADR-0002).

One exception, and it is a real one: **the type of the upstream payload is not the feature's to define.** `User` comes from the generated schema:

```ts
// src/apis/usersCache/fetchUsers.ts
export type User = z.infer<typeof GetRandomUsersResponse>["results"][number];
```

A feature imports that type from `@/apis/usersCache`. It does not re-declare it, and it does not write a `userSchema` that shadows the generated one.

## Shared values, and the type they carry

A `logics/` module can hold a plain value that more than one role needs. `src/features/UserList/logics/features/index.ts` is the example:

```ts
import { tableFeatures } from "@tanstack/react-table";

/**
 * The features the UserList table uses.
 *
 * TanStack Table v9 requires the features a table uses to be declared explicitly.
 * ...
 * It lives in its own module because both the hook and the column definitions
 * need the same type: the column definitions are typed as
 * `ColumnDef<typeof userListTableFeatures, User>`, and the hook builds the table
 * with those features.
 */
export const userListTableFeatures = tableFeatures({});
```

The value lives here for a specific reason: **the hook and the column definitions must agree on its type.** The hook builds the table with `features: userListTableFeatures`, and the columns are typed `ColumnDef<typeof userListTableFeatures, User>`. If each file built its own features object, the two would be different types and the columns would not fit the table.

When you extract a shared value for this reason, say so in the module's comment — it is the "why" that a reader would otherwise try to undo.

## Rules

- **No React, no Query, no network.** A file under `logics/` that imports `react` or `@tanstack/react-query` is in the wrong place. JSX is the exception: a generator may return JSX, because it is still pure.
- **No side effects.** A `logics/` function takes arguments and returns a value. It does not write to a cache, navigate, or show a dialog.
- **No reading from a hook.** A `logics/` function receives what it needs as an argument.
- **One unit per folder.** A folder holds one exported function or one tightly related group (a schema and its inferred type).
- **The folder name is the function's name.** `logics/convertToPresentationProps/index.ts` exports `convertToPresentationProps`.

## Anti-patterns

| Anti-pattern                                     | Why it is wrong                                                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `interface User {}` next to a schema             | Zod is the source of truth. `z.infer` gives the type.                                                         |
| A `src/types/<feature>.ts` file                  | Types belong to the feature, under `logics/schema/`.                                                          |
| `useQuery` inside a `logics/` file               | A logic that needs data is not pure. It belongs in a hook.                                                    |
| A converter with no branches, over one field     | Extraction adds a file, a type and an indirection. It pays for itself only when there is logic worth testing. |
| A converter-specific type, declared by hand      | Derive it from the presentation's props so the two cannot drift.                                              |
| A generator that reads a React context           | It needs the value as an argument.                                                                            |
| Two files each building the same features object | They would be different types. Share one — see `logics/features/`.                                            |
| A schema that re-declares the upstream payload   | The payload shape is owned by `openapi.yaml` and materialized by orval (ADR-0002).                            |

## Completion criteria

- Every file under `logics/` is pure: no React hooks, no Query, no network, no side effects.
- Each folder is named for what it exports, and the barrel re-exports what the other roles use.
- A converter's return type is derived from the presentation, not declared by hand.
- A generator that needs something from the caller takes it as a named argument.
- Schemas are the source of truth for the feature's own types; the upstream payload type is imported, not re-declared.

## Related skills

- `feature-hook` — the role that calls into `logics/`.
- `feature-presentation` — the role a converter targets.
- `feature-api-hook` — where the upstream payload type comes from.
- `build-feature` — the role tree this folder sits in.
