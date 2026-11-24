---
name: feature-presentation
description: The view of a feature — `src/features/<Name>/presentations/`. It renders the props it receives, owns the view state, and holds no knowledge of the data layer. Use when writing, changing, or reviewing anything under a feature's `presentations/`.
---

# feature-presentation

The presentation is the view. It renders what it is given and nothing more. It is the only role that returns JSX for the feature's main screen.

## What it owns

```
src/features/<Name>/presentations/
  index.tsx                   # the main view — receives everything via props
  <ChildComponent>/           # one folder per sub-component of the view
    index.tsx
```

`src/features/UserList/presentations/` is the canonical example. Read it before writing one.

## The shape

```tsx
// src/features/UserList/presentations/index.tsx
import type { Table as TanstackTable } from "@tanstack/react-table";

import type { User } from "@/apis/usersCache";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { userListTableFeatures } from "../logics/features";
import { UsersList } from "./UsersList";

type UserListPresentation = {
  onReset: () => void;
  showColors: boolean;
  toggleColors: () => void;
  sortByCountry: boolean;
  toggleSortByCountry: () => void;
  setFilterCountry: (country: string) => void;
  filterCountry: string | null;
  tableData: TanstackTable<typeof userListTableFeatures, User>;
};

export const UserListPresentation: React.FC<UserListPresentation> = ({
  toggleColors,
  toggleSortByCountry,
  onReset,
  setFilterCountry,
  showColors,
  sortByCountry,
  tableData,
}) => {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <a
        href="#users-table"
        className="focus:bg-primary focus:text-primary-foreground focus:ring-ring/30 sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-4xl focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:ring-3"
      >
        Skip to the users table
      </a>

      <header className="@container flex flex-col gap-4">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight text-balance">
          Users
        </h1>

        <div className="flex flex-col gap-4 @md:flex-row @md:flex-wrap @md:items-end @md:justify-between">
          {/* The filter is a search control, so it lives in a search landmark. */}
          <search aria-label="Filter users" className="flex w-full flex-col gap-1.5 @md:max-w-xs">
            <label htmlFor="filter-country" className="text-foreground text-sm font-medium">
              Filter by country
            </label>
            <Input
              id="filter-country"
              name="country"
              type="search"
              placeholder="Filter by Country"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              className="pointer-coarse:min-h-12"
              onChange={(e) => {
                setFilterCountry(e.target.value);
              }}
            />
          </search>

          <div className="flex flex-col gap-2 @sm:flex-row @sm:flex-wrap @sm:items-center">
            <Button
              variant="outline"
              aria-pressed={showColors}
              className="aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/80 aria-pressed:hover:text-primary-foreground pointer-coarse:min-h-12"
              onClick={toggleColors}
            >
              Toggle colors
            </Button>
            <Button
              variant="outline"
              className="pointer-coarse:min-h-12"
              onClick={toggleSortByCountry}
            >
              {sortByCountry ? "no sort by country" : "sort by country"}
            </Button>
            <Button variant="outline" className="pointer-coarse:min-h-12" onClick={onReset}>
              Reset users
            </Button>
          </div>
        </div>
      </header>

      <main id="users-table" tabIndex={-1}>
        <UsersList tableData={tableData} />
      </main>
    </div>
  );
};
```

This is `src/features/UserList/presentations/index.tsx`, reproduced in full. It is the shape a view has here, so copy it rather than paraphrase it.

What the markup shows, and what a reduced example used to hide:

- **The heading is the feature's name.** Not `Test`.
- **The filter is a labelled control inside a `<search>` landmark.** A `placeholder` is not a label; the `<label htmlFor>` and the `id` on the `Input` are what name the control.
- **A toggle that owns a boolean exposes its state.** `aria-pressed={showColors}` on the button, with the label reading the same either way — not a label that flips with the state.
- **The toolbar lays out with container queries.** `@container` on the `<header>` and `@md:` on the children, so the controls wrap instead of overflowing on a narrow screen.
- **There is a skip link to the region that holds the data.** `<main id="users-table" tabIndex={-1}>` is the target.

## Rules

- **Everything arrives through props.** The presentation knows nothing about the Query cache, the data source, or the upstream API. It cannot fetch, because it does not know how.
- **It owns the view state** — a modal's open flag, a local tab, a transient input value that is not part of the URL or the server data. `useState` and `useMemo` are allowed here.
- **It may not call `useQuery`, `useSuspenseQuery` or `useMutation`.** Those are the hook's. A presentation that queries is a presentation that renders a loading state it does not control.
- **The props type is declared here.** The presentation is the leaf of the render tree, so it is the source of its own props type. A consumer that needs it derives it with `React.ComponentProps<typeof UserListPresentation>`.
- **Handlers come in as props.** The presentation calls them; it does not define them and it does not know what they do.
- **A sub-component lives in its own folder** under `presentations/`, and the directory name matches the component name: `presentations/UsersList/index.tsx` exports `UsersList`. It takes only its own props.
- **Do not export a sub-component** that is only used by the parent view.

### The prop list

If the props list grows past about eight fields, the view is doing too much. Two ways out:

- Lift the derivation into the hook — a value that depends on data is the hook's job.
- Split the view into sub-components that take narrower props.

## Styling

This repository uses **Tailwind CSS v4** and the **shadcn** primitives. There is no SCSS, no CSS module, and no stylesheet of your own inside a feature.

- **Use the primitives in `src/components/ui/`** — `avatar`, `button`, `checkbox`, `input`, `table`. They are the shared library; a feature does not re-implement a button.
- **Use Tailwind utility classes** for layout and spacing: `className="flex flex-col gap-2 @sm:flex-row @sm:flex-wrap @sm:items-center"`.
- **Use `cn` to merge classes** when a class is conditional: `className={cn("base", isActive && "active")}`. It is re-exported from `src/lib/utils.ts`.
- **Do not write a `styles.module.scss`.** The upstream configuration for this repository described an SCSS-based layout; it does not apply here. `AGENTS.md` says the code on disk wins.
- **There is no `Stack` component in this repository.** The upstream rule "use `Stack` instead of `display: flex`" belongs to a different codebase. Here, a flex layout is `className="flex …"`.

## Rendering a table

TanStack Table v9 is in use. The row and header accessors differ from v8:

```tsx
// src/features/UserList/presentations/UsersList/index.tsx
{
  tableData.getHeaderGroups().map((headerGroup) => {
    return (
      <TableRow key={headerGroup.id}>
        {headerGroup.headers.map((header) => {
          return (
            <TableHead key={header.id}>
              {header.isPlaceholder
                ? null
                : flexRender(header.column.columnDef.header, header.getContext())}
            </TableHead>
          );
        })}
      </TableRow>
    );
  });
}

{
  tableData.getRowModel().rows.map((row) => {
    return (
      <TableRow key={row.id}>
        {row.getAllCells().map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    );
  });
}
```

- `row.getAllCells()` — **not** `row.getVisibleCells()`, which was v8.
- `tableData.getAllLeafColumns().length` — **not** `tableData.getColumn.length`, which was v8 and returned `1` rather than the column count.
- `flexRender(def, context)` still works in v9.

## Anti-patterns

| Anti-pattern                                      | Why it is wrong                                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `useSuspenseQuery` in a presentation              | The hook owns the queries. The presentation renders what it is given.                      |
| Importing `fetchUsers` in a presentation          | The presentation does not know the data layer.                                             |
| A handler defined in the presentation             | It comes in through props, from the hook's `actions`.                                      |
| A `components/` folder inside the feature         | Shared UI belongs in `src/components/ui/`; feature-only UI belongs under `presentations/`. |
| `styles.module.scss`                              | This repository uses Tailwind v4, not SCSS.                                                |
| `row.getVisibleCells()`                           | That is the v8 accessor. v9 uses `row.getAllCells()`.                                      |
| `tableData.getColumn.length`                      | That is the v8 accessor, and it returned `1`. Use `getAllLeafColumns().length`.            |
| Exporting a sub-component used only by the parent | It is an internal decomposition.                                                           |
| A props list of ten fields                        | Split the view, or lift the derivation into the hook.                                      |

## Completion criteria

- The presentation imports nothing from `@/apis/` and calls no query hook.
- Every value it renders arrives through props.
- Its props type is declared in its own file.
- Styling is Tailwind classes and the primitives in `src/components/ui/` — no stylesheet of its own.
- Sub-components live in their own folders under `presentations/`, named after the component.

## Related skills

- `feature-container` — the file that renders this view.
- `feature-hook` — the role that owns the data the view receives.
- `feature-logics` — where a converter that targets this view's props belongs.
- `build-feature` — the role tree this folder sits in.
