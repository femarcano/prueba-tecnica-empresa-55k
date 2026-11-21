---
name: feature-container
description: The composition entry of a feature — `src/features/<Name>/index.tsx`. It is the only file in the feature that knows both the hooks and the presentation: it calls the public hook, takes what it returns, and hands it to the presentation as props. Use when writing, changing, or reviewing a feature's `index.tsx`.
---

# feature-container

The container is the feature's public face. It is the file an application imports, and the **only** file in the feature that knows every role.

## What it owns

```tsx
src/features/<Name>/index.tsx
```

- Calling the feature's public hook (`use<Name>`).
- Taking what the hook returns and handing it to the presentation.
- Nothing else. No data fetching, no business rules, no formatting.

## The shape

```tsx
import { useUserList } from "./hooks";
import { UserListPresentation } from "./presentations";

export const UserList = () => {
  const {
    state: { showColors, sortByCountry, filterCountry, tableData },
    actions: { toggleColors, toggleSortByCountry, setFilterCountry, onReset },
  } = useUserList();

  return (
    <UserListPresentation
      filterCountry={filterCountry}
      onReset={onReset}
      setFilterCountry={setFilterCountry}
      showColors={showColors}
      sortByCountry={sortByCountry}
      tableData={tableData}
      toggleColors={toggleColors}
      toggleSortByCountry={toggleSortByCountry}
    />
  );
};
```

This is `src/features/UserList/index.tsx`. Read it before writing a container — it is the canonical example.

## Rules

- **Export only the component.** Do not re-export types from the presentation or the hook. A consumer that needs the props type gets it from the leaf component: `React.ComponentProps<typeof UserListPresentation>`.
- **Destructure the hook's return all the way down** — `state` and `actions` first, then each value — and pass each one to the presentation as an explicit prop.
- **Do not spread.** `<UserListPresentation {...state} {...actions} />` passes everything, including values the presentation does not need, and a JSX spread skips the excess-property check, so a renamed prop becomes a silent runtime `undefined` instead of a type error.
- **Do not define an anonymous function inline in the JSX.** A handler that the presentation receives must come from the hook's `actions`. Writing `onClick={() => …}` in the container puts logic in the file that is supposed to only wire things together.
- **Do not fetch data here.** The hook does that. The container has no `useQuery`, no `useSuspenseQuery`, no `fetch`.
- **Do not transform the data here.** Formatting and reshaping belong in `logics/`, and they are applied by the hook's callers or the presentation — not in the container.

### When the container is not needed

If the feature has no hook and no logic — the component only renders static or shared UI — do not split it into a container and a presentation. Write the UI in `index.tsx`. Two files that only pass props through is a folder with no reason to exist.

## Mounting the feature

A feature folder that nothing renders is not finished. The application mounts it in `src/App.tsx`:

```tsx
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { UserList } from "@/features/UserList";

function App() {
  return (
    <ErrorBoundary fallback={<p>Error loading users.</p>}>
      <Suspense fallback={<p>Loading users…</p>}>
        <UserList />
      </Suspense>
    </ErrorBoundary>
  );
}
```

The `Suspense` boundary matters: the feature's hook uses `useSuspenseQuery`, so the feature suspends while the first page of users loads. Without a boundary above it, the whole application suspends.

## Anti-patterns

| Anti-pattern                                            | Why it is wrong                                                                                |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `<UserListPresentation {...state} {...actions} />`      | Passes values the presentation does not need, and hides a renamed prop from the type checker.  |
| `const onClick = () => setThing(x)` in the container    | Puts logic in the wiring file. Handlers come from the hook's `actions`.                        |
| `useQuery` in `index.tsx`                               | The container is not the data layer. The hook owns queries.                                    |
| `format(new Date(user.registered.date))` in `index.tsx` | Display formatting belongs in `logics/`, not in the wiring file.                               |
| `export type { UserListPresentationProps }`             | The props type belongs to the leaf component; consumers derive it with `React.ComponentProps`. |
| A feature that is never mounted                         | An unrendered feature is not finished work.                                                    |

## Completion criteria

- `index.tsx` exports only the component.
- It calls the public hook and nothing else — no queries, no `fetch`, no formatting.
- Every value the presentation receives is passed as an explicit prop, one by one.
- Every handler it passes comes from the hook's `actions`.
- The feature is mounted in the application, under a `Suspense` boundary.

## Related skills

- `feature-hook` — the hook this container calls.
- `feature-presentation` — the component this container renders.
- `feature-logics` — where the transformations it hands on are defined.
- `build-feature` — the role tree this container sits in.
