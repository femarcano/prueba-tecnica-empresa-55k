# NOTES

Raw notes on this repository as it actually is. `CONTEXT.md` holds the domain glossary; this file holds everything else — the agent roster, the known gaps, and the terminology that is not domain vocabulary.

## Agent roster on `main`

| Agent             | Owns                                                            | Defined in                            |
| ----------------- | --------------------------------------------------------------- | ------------------------------------- |
| `developer-agent` | New features — production code only, no tests, no PR, no commit | `.opencode/agents/developer-agent.md` |
| `test-agent`      | The tests of a change, written before the change                | `.opencode/agents/test-agent.md`      |

Both are subagents: the main agent dispatches them.

### How the two fit together

The `test-agent` writes the tests first and hands them over with `it.skip`; the `developer-agent` implements the code and removes the skips.

```text
main agent
  ├─ test-agent       writes the tests of the specified behaviour
  │                    └─ hands over: "these files carry it.skip"
  └─ developer-agent  implements the code, removes the skips, makes them pass
```

The separation is the point. An agent that writes the code and the tests together tends to write the test that matches the code it just wrote. The `test-agent` has to decide what the behaviour should be from the description, before it knows how the code will be shaped.

The `test-agent` also handles refactorings, migrations and library updates — the cases where the tests must pass _before_ the change, because the change is supposed to be invisible.

### Agents that do not exist yet

Planned, not written. Each would get its own agent file in `.opencode/agents/`.

- A **pull-request agent** — commits the branch, opens the PR. `developer-agent` deliberately stops at the working tree so the human stays in control of what gets pushed.

## Known gaps

### The skills the developer agent reads

`developer-agent` is deliberately thin. It points at the conventions rather than restating them, and the conventions live in skills — one per role, plus the scaffolder that ties them together:

| Skill                  | Covers                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| `build-feature`        | The role tree and the steps to scaffold a feature. Points at the role skills.                           |
| `feature-container`    | `src/features/<Name>/index.tsx` — the composition entry.                                                |
| `feature-hook`         | `src/features/<Name>/hooks/**` — the stateful half.                                                     |
| `feature-api-hook`     | How a hook imports and calls `src/apis/usersCache/`.                                                    |
| `feature-logics`       | `src/features/<Name>/logics/**` — converters, generators, schemas, shared values.                       |
| `feature-presentation` | `src/features/<Name>/presentations/**` — the view.                                                      |
| `feature-testing`      | How to write a test in this repository — placement, stubbing, queries, and which layer owns which test. |
| `ui-component`         | How the shared primitives in `src/components/ui/` are written and added.                                |

The agents read the skill for the role they are about to write, not all of them.

There are no gaps left in the skills: every role a change can touch has one.

### The rules

`.opencode/rules/pr-creation-constraints.md` holds how a pull request is made in this repository: the `pr` skill writes the body, one concern per pull request, the four checks before the PR is opened, and the branch and commit conventions. It is loaded through the `instructions` array in `opencode.json`.

There is no `.github/pull_request_template.md` convention here — that file is inherited from another repository and its headings do not apply. The merged pull requests use the `pr` skill's `Summary` / `Evidence` / `Merge Danger`.

### Two lineages of agent configuration

This repository carries two separate bodies of agent configuration, and the split is deliberate:

- **`main`** — the repo-native lineage. `CONTEXT.md`, `docs/adr/`, `.opencode/skills/build-feature/`, and the agents written for this repository's actual layout. This is what the `developer-agent` reads.
- **`chore/migrate-claude-config-to-opencode`** (local, unpushed) — an imported configuration authored for a different, larger codebase. It contains a full `.opencode/` tree with ten upstream agents, a dozen rules, and eighteen skills that describe an `apps/*/src/…` monorepo with Storybook, Figma, SWR, and a `partner-admin` / `merchant` / `portal` app split. None of that describes this repository.

The imported lineage is style and process guidance, not a description of this codebase. Where the two conflict, the code on disk wins. It is deliberately **not** merged into `main` yet, so the upstream layout does not leak into the instructions every session loads.

### `build-feature` has a known staleness

`.opencode/skills/build-feature/samples/orders.md` still shows the `OrdersRepository` interface and a `src/repositories/` seam. ADR-0001 removed both. The `SKILL.md` body itself is current; only the worked sample is stale.

## Terminology that is not domain vocabulary

These are the words used when talking about the work itself, as distinct from the words the domain uses.

- **Feature** — a folder under `src/features/<Name>/` with the role tree (`index.tsx`, `hooks/`, `logics/schema/`, `presentations/`). The unit this repository builds in.
- **Role tree** — the fixed set of folders inside a feature, each named for the kind of code it holds. The number of files inside a role is not fixed.
- **Component** — in `src/components/ui/`, a shared shadcn-style primitive. A view used by only one feature is not a component; it lives under that feature's `presentations/<Child>/`.
- **Check** — one of the four verification commands: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm format:check`.
- **Brief** — the report the agent hands back: what was produced, which decisions were made and why, the measured result of each check, and what was left out. Never the raw output of the checks.
- **Scope** — the paths the agent may write to: `src/` only. Everything else is reported, not edited.
