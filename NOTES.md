# NOTES

Raw notes on this repository as it actually is. `CONTEXT.md` holds the domain glossary; this file holds everything else — the agent roster, the known gaps, and the terminology that is not domain vocabulary.

## Agent roster on `main`

| Agent             | Owns                                                            | Defined in                            |
| ----------------- | --------------------------------------------------------------- | ------------------------------------- |
| `developer-agent` | New features — production code only, no tests, no PR, no commit | `.opencode/agents/developer-agent.md` |

That is the whole roster on this branch. `developer-agent` is a subagent: the main agent dispatches it with a description of a feature.

### Agents that do not exist yet

Planned, not written. Each would get its own agent file in `.opencode/agents/`.

- A **pull-request agent** — commits the branch, opens the PR. `developer-agent` deliberately stops at the working tree so the human stays in control of what gets pushed.
- A **test agent** — writes the tests for a new feature. `developer-agent` writes production code only and must not author or edit tests to make a check pass.

## Known gaps

### The skills the developer agent reads

`developer-agent` is deliberately thin. It points at the conventions rather than restating them, and the conventions live in skills — one per role, plus the scaffolder that ties them together:

| Skill                  | Covers                                                                            |
| ---------------------- | --------------------------------------------------------------------------------- |
| `build-feature`        | The role tree and the steps to scaffold a feature. Points at the role skills.     |
| `feature-container`    | `src/features/<Name>/index.tsx` — the composition entry.                          |
| `feature-hook`         | `src/features/<Name>/hooks/**` — the stateful half.                               |
| `feature-api-hook`     | How a hook imports and calls `src/apis/usersCache/`.                              |
| `feature-logics`       | `src/features/<Name>/logics/**` — converters, generators, schemas, shared values. |
| `feature-presentation` | `src/features/<Name>/presentations/**` — the view.                                |

The agent reads the skill for the role it is about to write, not all of them.

Two gaps remain, and neither is a skill yet:

- **Feature testing** — how to write the Vitest test for a feature in this repository: where the test file goes (next to the target, `*.test.ts(x)`), how the network is stubbed (`vi.stubGlobal("fetch", …)` at the boundary, per `CONTEXT.md`'s `Fake` entry), the test-name convention, and the fact that this repository's Vitest configuration has no global cleanup, so a view-level test has to call `cleanup()` itself.
- **A skill for `src/components/ui/`** — how a shared shadcn primitive is added to this repository, as distinct from the upstream configuration's SCSS-based `ui/` rules, which do not apply here.

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
