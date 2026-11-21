---
name: ui-component
description: How the shared UI primitives in `src/components/ui/` are written and added in this repository — Tailwind v4 utility classes over the semantic colour tokens, `@base-ui/react` primitives, the `cn` merge, `data-slot` tagging, and `cva` variants. Use when creating, changing, or reviewing anything under `src/components/ui/`.
---

# ui-component

`src/components/ui/` holds the **shared** primitives: the ones more than one feature uses. They are stateless, know nothing about the domain, and are built on `@base-ui/react` with Tailwind v4 utility classes.

| File | What it is |
|---|---|
| `avatar.tsx` | `Avatar`, `AvatarImage`, `AvatarFallback`, `AvatarGroup`, `AvatarGroupCount`, `AvatarBadge` |
| `button.tsx` | `Button`, `buttonVariants` |
| `checkbox.tsx` | `Checkbox` |
| `input.tsx` | `Input` |
| `table.tsx` | `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption` |

## What belongs here, and what does not

**Here:** a primitive that is reusable across features and free of domain vocabulary. A `Button`, an `Input`, a `Table`.

**Not here:** a view that only one feature uses. That belongs under the feature's `presentations/<Child>/`. A component that knows what a `User` is, or that filters a list of them, is not shared.

The test: **could a second feature use this without changing it?** If not, it is not shared.

## The shape of a primitive

Every component here follows the same four conventions.

### 1. It wraps a `@base-ui/react` primitive, and passes the props through

```tsx
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "cn";
import * as React from "react";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-3xl border border-transparent bg-input/50 px-3 py-1 text-base …",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
```

- The base-ui primitive is imported with an alias — `InputPrimitive`, `ButtonPrimitive` — so the local name is the component's own name.
- The props type comes from the primitive: `React.ComponentProps<"input">` for a plain element, `CheckboxPrimitive.Root.Props` for a base-ui one.
- **`className` is destructured out and merged**, so a consumer can override the styling, and the rest of the props are spread onto the primitive.
- The component is **exported at the bottom**, in a single `export { … }` statement.

### 2. The styling is Tailwind v4 utility classes over the semantic tokens

There is **no CSS file, no SCSS, and no `styles.module.scss`** in `src/components/ui/`. The styling is one Tailwind class string.

Use the semantic tokens, never a raw colour:

| Instead of | Use |
|---|---|
| `bg-blue-500` | `bg-primary`, `bg-secondary`, `bg-muted`, `bg-accent`, `bg-destructive` |
| `text-gray-900` | `text-foreground`, `text-muted-foreground`, `text-primary-foreground` |
| `border-gray-200` | `border-border`, `border-input`, `border-destructive` |
| `outline-blue-500` | `focus-visible:ring-ring`, `focus-visible:border-ring` |

The tokens are defined in `src/index.css` as `--color-*` variables, which Tailwind v4 turns into the utilities above. The full set is `primary`, `secondary`, `muted`, `accent`, `destructive`, `card`, `popover`, `background`, `foreground`, `border`, `input`, `ring`, and their `-foreground` pairs.

### 3. `cn` merges the classes

```tsx
import { cn } from "cn";
```

**Import `cn` from the `cn` package directly**, not from `@/lib/utils` — that is what the existing components do. `src/lib/utils.ts` exists and re-exports it, but the primitives import the package itself.

`cn` is `clsx` + `tailwind-merge`, so it resolves conflicting Tailwind classes in favour of the last one. That is why the consumer's `className` goes last: it wins.

### 4. Every part is tagged with `data-slot`

```tsx
<AvatarPrimitive.Root data-slot="avatar" data-size={size} …>
<AvatarPrimitive.Image data-slot="avatar-image" …>
<TableRow data-slot="table-row" …>
```

`data-slot` is the hook the rest of the styling hangs on. A state is expressed through it or through a data attribute next to it — `data-size={size}` on the avatar, `data-checked:` on the checkbox.

```tsx
"group/avatar relative flex size-8 shrink-0 rounded-full … data-[size=lg]:size-10 data-[size=sm]:size-6 …"
```

That is a Tailwind variant selector reading a data attribute. It is how a primitive styles itself in each state.

## Variants

A component with variants uses `cva`:

```tsx
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-4xl border border-transparent …",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline: "border-border bg-background hover:bg-muted hover:text-foreground …",
        secondary: "bg-secondary text-secondary-foreground …",
        ghost: "hover:bg-muted hover:text-foreground …",
        destructive: "bg-destructive/10 text-destructive …",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-1.5 px-3 …",
        xs: "h-6 gap-1 px-2.5 text-xs …",
        sm: "h-8 gap-1 px-3 …",
        lg: "h-10 gap-1.5 px-4 …",
        icon: "size-9 …",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
```

**`buttonVariants` is exported**, so a consumer can compose the classes without the component:

```tsx
import { buttonVariants } from "@/components/ui/button";
```

Only `button` has variants today. A component that needs one set of variants uses `cva`; a component that needs a size and a colour often takes them as plain props instead — the avatar's `size?: "default" | "sm" | "lg"` with `data-size={size}` is that pattern.

## Adding a component

**First, check whether shadcn already provides it.** This repository is configured for shadcn:

```json
// components.json
{
  "style": "base-luma",
  "rsc": false,
  "tsx": true,
  "tailwind": { "config": "", "css": "src/index.css", "baseColor": "neutral", "cssVariables": true, "prefix": "" },
  "iconLibrary": "remixicon",
  "aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui", "lib": "@/lib", "hooks": "@/hooks" }
}
```

```console
$ pnpm exec shadcn add <name>
```

The CLI writes the component into `src/components/ui/`, already styled with these conventions. **Prefer the CLI over writing one by hand** — it keeps the file consistent with the ones the CLI generates, and it brings the component from the same source as the others.

Then check what it produced against the four conventions above, and adjust:

- It uses the `cn` package for merging the classes.
- Every part carries a `data-slot`.
- The colours are the semantic tokens.
- The props are spread through, and `className` is merged.

**When you write one by hand**, follow the shape in the section above: the base-ui primitive aliased, `className` destructured and merged last, `data-slot` on every part, the export at the bottom.

## Icons

The icon library is **`@remixicon/react`**, imported by name:

```tsx
import { RiCheckLine } from "@remixicon/react";
```

There is no icon barrel and no `assets/icons/` directory in this repository — the upstream configuration's SVG pipeline does not apply. Import the icon from the package.

## Rules

- **Tailwind utility classes only.** No CSS file, no SCSS, no inline `style` object.
- **Semantic tokens only.** No `blue-500`, no `gray-100`.
- **`cn` from the `cn` package**, with the consumer's `className` last.
- **`data-slot` on every part**, so the styling has a hook.
- **No domain vocabulary.** A primitive does not know what a user is.
- **No data fetching, no state.** A primitive is stateless. A primitive that needs state belongs in a feature's `presentations/`.
- **No `Stack`.** There is no `Stack` component in this repository — the upstream rule "use `Stack` instead of `display: flex`" belongs to a different codebase. A flex layout is `className="flex …"`.
- **The props type comes from the primitive**, not from a hand-written interface.

## Anti-patterns

| Anti-pattern | Why it is wrong |
|---|---|
| `styles.module.scss` beside a component | This repository uses Tailwind v4. There is no SCSS. |
| `className="bg-blue-500"` | A raw colour. Use the semantic token. |
| `import { cn } from "@/lib/utils"` | The primitives import the `cn` package directly. |
| `style={{ color: … }}` | Inline styles cannot be overridden by the consumer's `className`. |
| A `Stack` component | It does not exist here. |
| A component that imports from `@/apis/` | A primitive does not know the data layer. |
| A component that filters a list of users | That is a feature view, not a shared primitive. |
| Passing `className` through without merging | The consumer's classes would lose to the component's. |
| A `data-testid` on a primitive | The primitive's role is the assertion. `data-slot` is for styling. |

## Completion criteria

- The component is in `src/components/ui/<name>.tsx`, and it is reusable by more than one feature.
- It wraps a `@base-ui/react` primitive, or is a plain HTML element — and it passes its props through.
- The styling is one Tailwind class string, over the semantic tokens.
- `cn` merges the classes, with the consumer's `className` last.
- Every part carries a `data-slot`.
- The export is at the bottom of the file, in one `export { … }` statement.
- There is no CSS file, no SCSS, and no `Stack`.

## Related skills

- `feature-presentation` — the role that consumes these primitives.
- `feature-testing` — how a component that uses them is tested.
