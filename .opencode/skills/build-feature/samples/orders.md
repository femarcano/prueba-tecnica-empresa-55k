# Worked example — Orders feature

A complete, minimal feature folder that exercises every role in the skill. One noun (`Order`), one stateful concern (`useGetOrders`), one presentation view, one child component. Reads top-to-bottom in the same order as `Steps` in `SKILL.md`.

## Folder

```
src/features/orders/
  index.tsx
  hooks/
    index.ts
    useGetOrders/
      index.ts
  logics/
    index.ts
    schema/
      index.ts
  presentations/
    index.tsx
    OrdersList/
      index.tsx
```

## 1. `logics/schema/index.ts`

Schemas first. Types are inferred, never written.

```ts
import { z } from "zod";

export const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  postcode: z.string(),
});

export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
});

export const orderSchema = z.object({
  id: z.string(),
  customer: customerSchema,
  shipTo: addressSchema,
  total: z.number().nonnegative(),
  placedAt: z.date(),
});

export type Address = z.infer<typeof addressSchema>;
export type Customer = z.infer<typeof customerSchema>;
export type Order = z.infer<typeof orderSchema>;
```

Notice: sub-schemas compose by reference (`customer: customerSchema`), not by inlining. Each `<noun>Schema` exports its inferred `<Noun>` next to it.

## 2. `logics/index.ts`

One line. The barrel.

```ts
export * from "./schema";
```

## 3. `hooks/useGetOrders/index.ts`

Stateful concern — talks to the data source. Accepts the repository as a parameter; never instantiates one.

```ts
import { useQuery } from "@tanstack/react-query";
import type { OrdersRepository } from "../../../../repositories/ordersRepository";
import type { Order } from "../../logics";

export const useGetOrders = (repository: OrdersRepository) => {
  const { data: orders = null, isLoading, error } = useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: () => repository.getOrders(),
  });
  return { orders, isLoading, error };
};
```

What this file does NOT do:
- `new OrdersRepository()` — that's the singleton pattern; the parameter is the seam.
- Local `useState` — that's view state; it lives in the presentation.
- Filters, sorts, derived data — those are pure derivations; the presentation handles them.

## 4. `hooks/index.ts`

The public hook composes the sub-hooks. No sub-hooks here yet, but the structure is in place for when one appears.

```ts
import { useGetOrders } from "./useGetOrders";
import type { OrdersRepository } from "../../../repositories/ordersRepository";

export const useOrders = (repository: OrdersRepository) => {
  const { orders, isLoading, error } = useGetOrders(repository);
  return { state: { orders, isLoading, error }, actions: {} };
};
```

The hook returns `{ state, actions }` even when `actions` is empty — keeps the composition entry's destructuring stable as the feature grows.

## 5. `presentations/OrdersList/index.tsx`

The child component of the view. Takes only its own props. No hooks except trivial ones.

```tsx
import type { Order } from "../../logics";

interface OrdersListProps {
  orders: Order[];
  onDelete: (id: string) => void;
}

export const OrdersList = ({ orders, onDelete }: OrdersListProps) => {
  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Customer</th>
          <th>Total</th>
          <th>Placed</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id}>
            <td>{order.id}</td>
            <td>{order.customer.name}</td>
            <td>{order.total.toFixed(2)}</td>
            <td>{order.placedAt.toISOString().slice(0, 10)}</td>
            <td>
              <button onClick={() => onDelete(order.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

## 6. `presentations/index.tsx`

The main view. Receives everything via props. Reads nothing from Query or repositories.

```tsx
import { OrdersList } from "./OrdersList";
import type { Order } from "../logics";

interface OrdersViewProps {
  orders: Order[] | null;
  isLoading: boolean;
  error: Error | null;
  onDelete: (id: string) => void;
}

export const OrdersView = ({
  orders,
  isLoading,
  error,
  onDelete,
}: OrdersViewProps) => {
  return (
    <div>
      <h1>Orders</h1>
      {isLoading && <p>Loading orders…</p>}
      {error && <p>Error loading orders.</p>}
      {orders && !isLoading && !error && (
        <OrdersList orders={orders} onDelete={onDelete} />
      )}
    </div>
  );
};
```

Three explicit branches (`isLoading`, `error`, ready). No collapse into one ternary.

## 7. `index.tsx` — the composition entry

The only file that knows about every role. Wires the public hook into the presentation.

```tsx
import { useOrders } from "./hooks";
import { OrdersView } from "./presentations";
import type { OrdersRepository } from "../../repositories/ordersRepository";

interface OrdersProps {
  repository: OrdersRepository;
}

export const Orders = ({ repository }: OrdersProps) => {
  const { state } = useOrders(repository);
  return (
    <OrdersView
      orders={state.orders}
      isLoading={state.isLoading}
      error={state.error}
      onDelete={() => {}}
    />
  );
};
```

The `onDelete` is a placeholder — wiring real mutations is a separate concern that lives in the hooks layer (`queryClient.setQueryData`, `useMutation`). See the `UserList/hooks/useGetUsers/index.ts` for the deletion pattern.

## 8. Composition root — `src/main.tsx`

```tsx
import { OrdersRepository } from "./repositories/ordersRepository";
import { HttpOrdersRepository } from "./repositories/ordersRepository";

const ordersRepository = new HttpOrdersRepository();

<App ordersRepository={ordersRepository} />
```

`main.tsx` is the only file that names a concrete adapter. Tests substitute the fake here.

## What's not in this example

- Mutations (delete, reset). The pattern: `useMutation` or `queryClient.setQueryData` in a hook, returned as `actions` from the public hook, passed as props to the presentation.
- Filters and sort. Pure derivations — `useMemo` in the presentation, fed by `useState` for the flag.
- Sub-presentations beyond `OrdersList`. Same pattern: `presentations/<ChildName>/index.tsx`, narrower props.
- Repository adapter classes. They're outside the feature folder. The interface (`OrdersRepository`) is in `src/repositories/`; this feature only imports the interface, never a concrete class.

## What to verify before shipping

Run the deletion test on each role:

- Delete `logics/schema/` — every feature module breaks because no types exist. **Earns its place.**
- Delete `hooks/useGetOrders/` — the view can't fetch. **Earns its place.**
- Delete `hooks/index.ts` — `index.tsx` can't wire the hook. **Earns its place.**
- Delete `presentations/OrdersList/` — the table renders inline in `OrdersView`, which becomes wider. **Conditionally earns its place** — only needed if the table is reused or the parent prop list grows.
- Delete `index.tsx` — the feature has no entry point. **Earns its place.**