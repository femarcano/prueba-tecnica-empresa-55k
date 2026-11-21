---
paths:
  - "**/*.md"
  - "**/*.ts"
  - "**/*.tsx"
---

These `paths:` globs are the trigger conditions for this rule; OpenCode loads them via the `instructions` glob in `opencode.json`.

# worktree-constraints

## Every change gets its own worktree

A new change, a new feature, a bug fix — each one gets a **worktree of its own**, outside the main working directory. The main checkout stays on `main` and clean; the work happens somewhere else.

```
main checkout:   ~/Projects/prueba-tecnica-empresa-55k/
worktrees:       ~/Projects/prueba-tecnica-empresa-55k-worktrees/<name>/
```

The worktrees live in a **sibling directory**, named after the project: `<project>-worktrees/`. Under that folder, each worktree gets a folder named after the change.

| The change                 | The worktree                                                      | The branch                  |
| -------------------------- | ----------------------------------------------------------------- | --------------------------- |
| A new feature `UserTable`  | `prueba-tecnica-empresa-55k-worktrees/feat-user-table/`           | `feat/user-table`           |
| A defect fix in the filter | `prueba-tecnica-empresa-55k-worktrees/fix-filter-case/`           | `fix/filter-case`           |
| The header rewrite         | `prueba-tecnica-empresa-55k-worktrees/feat-header-accessibility/` | `feat/header-accessibility` |

**The folder name is the branch name with its slashes turned into dashes.** That way the folder says what the change is, and the mapping back to the branch is mechanical.

## Why a worktree, and not a branch in the main checkout

The main checkout is the **integration point**. It sits on `main`, it is clean, and it is what a human looks at to see the state of the project. A branch checked out there would change that: the tree would carry another change's files, and two changes could not be worked on at once.

A worktree keeps them separate:

```console
$ git worktree add -b feat/user-table \
    ../prueba-tecnica-empresa-55k-worktrees/feat-user-table main
```

The branch belongs to the same repository — it is not a clone. `git worktree list` shows every one of them, and the usual `git` commands work in it as they do anywhere else.

## The flow

```
a change is agreed
  → create the worktree (branch + folder, both named after the change)
  → do the work in the worktree
  → commit on the branch inside the worktree
  → the four checks, run in the worktree
  → push the branch
  → open the pull request
  → the human merges
  → the worktree is removed once the branch is merged
```

**The work in the worktree is the only work.** Do not edit files in the main checkout — that is what the worktree exists to prevent. If a change has to be made in the main checkout, the change does not belong in a worktree yet, and it belongs in one.

## Setting the worktree up

A fresh worktree has the source but not the **generated** files: `src/apis/__generated__/` is gitignored, so a new checkout has no Orval client and no Zod schemas. The types do not resolve and every test file fails to import.

```console
$ pnpm orval
```

Run it once, right after creating the worktree, before the four checks. The output is gitignored, so it never enters a commit.

## Removing a worktree

A worktree is removed when its branch is merged. The **`worktree-cleanup` skill** holds the checks: it reads the merged state and the age of the branch, and it asks before removing anything that has been stale for more than two weeks.

## Never, when using a worktree

- **Never create a worktree from inside another worktree.** The path is always the sibling folder, relative to the project root.
- **Never commit to `main` from a worktree.** The worktree has its own branch.
- **Never leave a worktree behind with a branch that is already merged.** Remove it, or hand it to the `worktree-cleanup` skill.
- **Never remove a worktree that has uncommitted changes.** The skill checks for this and reports it instead.
- **Never delete a branch that is not merged, and never force-push.** Removing a worktree does not delete its branch, and that is deliberate: the branch is what the pull request lives on.
