---
paths:
  - "**/*.md"
  - "**/*.ts"
  - "**/*.tsx"
---

These `paths:` globs are the trigger conditions for this rule; OpenCode loads them via the `instructions` glob in `opencode.json`.

# pr-creation-constraints

## The `pr` skill creates the pull request

When the work is ready to become a pull request, use the **`pr` skill**. It holds the body template and the rules for what goes in it. Do not improvise the body, the commit, or the `gh pr create` call by hand.

```
work is ready
  → one concern check
  → branch + conventional commit
  → the four checks
  → push
  → write the body (the `pr` skill's template)
  → gh pr create
  → confirm
```

## The body

The body follows the **`pr` skill**'s template — `## Summary`, `## Evidence`, `## Merge Danger`. This is the convention in this repository's merged pull requests.

| Section           | What goes in it                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `## Summary`      | The smallest view that makes the key point clear: a diff-sketch, a tree, a call tree. What changed and why. |
| `## Evidence`     | The measured before and after. The exact command and its real output, including the counts.                 |
| `## Merge Danger` | `**Door:**` one-way or two-way, and `**Blast Radius:**` the scope of what merging it affects.               |

Keep the prose brief. The reader is checking the change, not reading it.

**Do not use `.github/pull_request_template.md`'s placeholder headings.** That file is inherited from another repository and its sections ("Work Item ID", "Steps to Reproduce Bug", "PR Checklist") do not apply here. The merged pull requests in this repository use the `pr` skill's headings, and a reviewer expects that shape.

**Do not quote the raw output of the checks.** Quote the measurement — "31 advisories → 1", "36 passed (5 files)" — not the log.

## One concern per pull request

Before committing, check that the changes are one concern: **would reverting them together roll back something unrelated?**

If they would, do not create the PR. Present a split — the branches, and what each one would contain — and let the human decide.

A pull request that mixes a bug fix with a dependency bump, or a feature with a refactor, is hard to review and hard to revert. The split is cheaper before the commit than after it.

## The checks, before the pull request

Run all four and quote their real results:

| Command                  | What it checks                       |
| ------------------------ | ------------------------------------ |
| `pnpm lint`              | `oxlint src` — the correctness rules |
| `pnpm exec tsc --noEmit` | the types                            |
| `pnpm test`              | `vitest run` — the whole suite       |
| `pnpm format:check`      | `oxfmt --check` — the formatting     |

`pnpm build` is not one of them: the `vite build` is slow, and `tsc --noEmit` is the part that catches code errors.

**A check that fails because of the change must be fixed, not reported.** A pull request whose own lint fails is not ready. A check that fails for a reason outside the change is reported as it is, with the reason.

## Formatting, before the checks

`pnpm format:changed` formats only the files the change touches, and names every file it rewrote:

```console
$ pnpm format:changed
Formatted 12 file(s) in this change.
The formatter rewrote:
  src/features/UserList/index.tsx
```

**Never run `pnpm format`.** It rewrites every file in the repository and buries the change under the formatter's opinion of files nobody opened. `format:changed` does the same job for the change's own files, and the rewrite stays visible in the diff.

The formatter covers `.opencode/` as well as the source, so the rules, the skills and the agents are formatted too.

## Conventions

- **Branch name:** `<type>/<description>`, in alphanumerics, hyphens and slashes. No full-width characters.
- **Commit message:** conventional commits — `<type>(<scope>): <summary>`. The type is `feat`, `fix`, `docs`, `style`, `refactor`, `test` or `chore`. The scope is the area, in parentheses, when it helps: `chore(deps)`, `fix(lint)`, `feat(table)`.
- **The commit message says why, not what.** The diff already says what.
- **The body is in English**, like the code, the commits, and the rest of this repository.
- **The PR is not a Draft.** There is no review agent in this repository that would gate it, and a Draft blocks the merge for no reason. Open it ready.

## Never, when creating a pull request

- **Never push to `main`.** The branch is created first, the work is committed onto it, and the branch is pushed.
- **Never force-push.** If the history has to be rewritten, ask the human.
- **Never create the PR from a worktree without `--head`.** `gh` infers a branch name from the worktree's directory, and the PR ends up on a branch nobody intended.
- **Never merge the PR.** A human merges.
- **Never leave the temporary body file behind.** It goes outside the repository, so it does not become an untracked file.
