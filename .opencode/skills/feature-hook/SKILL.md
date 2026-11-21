---
name: feature-hook
description: The stateful half of a feature — `src/features/<Name>/hooks/`. The public hook owns the queries, the mutations, the local state and the handlers; the sub-hooks own one stateful concern each. Use when writing, changing, or reviewing anything under a feature's `hooks/`.
---

# feature-hook

The hook is where a feature's behaviour lives. It is the only role that may talk to the data layer, and the only role that may hold state that survives a render.

## What it owns

```
src/features/<Name>/hooks/
  index.ts                    # the public hook — the feature's single entry point
  <useCase>/                  # one folder per stateful concern
    index.ts
```

`src/features/UserList/hooks/index.ts` is the canonical example. Read it before writing one.

## The public hook

```ts
export const useUserList = () => {
  const { users, onDelete, onReset } = useGetUsers();

  const [showColors, setShowColors] = useState(false);
  const [sortByCountry, setSortByCountry] = useState(false);
  const [filterCountry, setFilterCountry] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    /* ... */
  }, [users, filterCountry]);
  const sortedUsers = useMemo(() => {
    /* ... */
  }, [filteredUsers, sortByCountry]);

  const tableData = useTable({/* ... */});

  const toggleColors = () => {
    setShowColors(!showColors);
  };
  const toggleSortByCountry = () => {
    setSortByCountry((prevState) => !prevState);
  };

  return {
    actions: {
      onDelete,
      onReset,
      setFilterCountry,
      toggleColors,
      toggleSortByCountry,
    },
    state: {
      filterCountry,
      showColors,
      sortByCountry,
      sortedUsers,
      tableData,
      users,
    },
  };
};
```

## Rules

- **The return value is `{ state, actions }`.** One object, two groups. The container destructures once and passes each value on explicitly.
- **`state` is data; `actions` is behaviour.** Anything the presentation needs to _see_ is in `state`. Anything it needs to _do_ is in `actions`.
- **One public hook per feature.** Sub-hooks go in their own folders (`hooks/useGetUsers/`). The public hook composes them.
- **The hook calls the data layer.** This is the only role that may call `useSuspenseQuery`, `useQuery`, `useMutation` or `fetch`. See `feature-api-hook` for how it reaches the data.
- **Local `useState` is for view state only** — a filter's text, a flag, whether a dialog is open. Data that comes from the server belongs to the Query cache, not to `useState`.
- **Mutations go through the cache**, not through local state. `cache.remove(uuid)` and `cache.reset()` mutate the Query cache; a local `useState` copy of the list would drift from it.
- **Handlers are defined here, in the hook.** The container passes them on unchanged, and the presentation calls them. Do not define a handler in the presentation or the container.
- **`useMemo` for derivations, not for ceremony.** Wrap a computation in `useMemo` when it is expensive or when it is a dependency of another memo. Do not wrap a trivial expression to "be safe" — it adds a dependency array to keep correct.

### Deriving state

The filtered and sorted lists above are derived from `users`. They are `useMemo`, not `useState`:

```ts
const filteredUsers = useMemo(() => {
  return filterCountry !== null && filterCountry.length > 0
    ? users.filter((user) => {
        return user.location.country.toLocaleLowerCase().includes(filterCountry.toLowerCase());
      })
    : users;
}, [users, filterCountry]);
```

Deriving state from other state through a memo keeps one source of truth. Storing the filtered list in its own `useState` would mean keeping two lists in sync by hand.

### When the derivation belongs in `logics/`

A `useMemo` is fine for a short derivation inline in the hook. When the transformation has **branches worth covering with tests**, or needs to be reused, move it to `logics/` and call it from the hook. See `feature-logics`.

## Sub-hooks

A sub-hook owns one stateful concern:

```ts
// src/features/UserList/hooks/useGetUsers/index.ts
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

- The sub-hook's folder name matches the hook's name.
- It returns the data and the mutations for its concern, and nothing else.
- The public hook composes it. The container never imports a sub-hook directly.

## Anti-patterns

| Anti-pattern                                             | Why it is wrong                                                                                                                    |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `new HttpXxxRepository()` inside a hook                  | The singleton pattern. ADR-0001 removed the repository layer — there is no seam until a second adapter exists.                     |
| `const [users, setUsers] = useState([])` next to a query | Two sources of truth. The server data lives in the Query cache.                                                                    |
| `useEffect(() => { fetchUsers().then(setUsers) }, [])`   | The Query cache does this. A `useEffect` that fetches duplicates it without the caching, the deduplication, or the error handling. |
| Defining a handler in the presentation and passing it up | The handler belongs to the hook, in `actions`.                                                                                     |
| Returning a flat object `{ users, onDelete, … }`         | The container destructures once from `{ state, actions }`. A flat return does not separate data from behaviour.                    |
| A sub-hook imported directly by the container            | The public hook is the feature's single entry point.                                                                               |
| `useMemo` around a trivial expression                    | A dependency array to keep correct, for no benefit.                                                                                |

## Completion criteria

- The public hook returns `{ state, actions }`.
- Every query and mutation lives in the hook or one of its sub-hooks — nowhere else in the feature.
- Local state holds only view state; server data comes from the Query cache.
- Every handler the presentation needs is in `actions`.
- No repository, adapter, or provider was introduced (ADR-0001).

## Related skills

- `feature-api-hook` — how the hook reaches the data layer.
- `feature-container` — the file that calls this hook.
- `feature-logics` — where a complex derivation belongs.
- `build-feature` — the role tree this hook sits in.
