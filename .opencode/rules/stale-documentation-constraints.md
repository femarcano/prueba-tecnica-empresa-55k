---
paths:
  - "**/*.md"
  - "**/*.ts"
  - "**/*.tsx"
---

These `paths:` globs are the trigger conditions for this rule; OpenCode loads them via the `instructions` glob in `opencode.json`.

# stale-documentation-constraints

## The documentation drifts, and that is expected

The code moves faster than the notes that describe it. A skill shows an example that no longer exists, a `NOTES.md` entry describes a gap that was closed last week, an ADR's title names a decision its own body rejects.

**An agent that finds this does not fix it in passing.** A finding is set aside and reported when the agent's own task is done. The agent's task is one concern; fixing the documentation is another.

## What counts as stale

Anything under these paths that no longer describes the repository:

| The path | What lives there |
|---|---|
| `.opencode/skills/**` | The role skills, their worked examples, the `build-feature` sample |
| `.opencode/rules/**` | The rules that constrain the agents |
| `.opencode/agents/**` | The agent definitions |
| `CONTEXT.md` | The domain vocabulary — the terms and what they mean |
| `NOTES.md` | The commands, the architecture, the known gaps |
| `docs/adr/**` | The decision records |

**Report everything out of date.** Not only the contradictions — the harmless wording, the historical note that no longer describes anything, the example that drifted. The PL decides what is worth changing; the agent does not filter.

## Set it aside, do not fix it

When an agent reads a rule, a skill, `CONTEXT.md`, `NOTES.md` or an ADR and finds it out of date, the agent **records the finding and carries on with its task**. The finding is not fixed, not edited, and not mentioned mid-task.

Two reasons:

1. **The agent's task is one concern.** A feature implementation that also rewrites three skills is a change nobody can review or revert.
2. **The agent is not the judge.** What counts as stale, and whether it is worth changing, is the PL's call. An agent that rewrites the documentation on its own initiative makes decisions that were not its to make.

**The finding goes in the agent's own report.** There is no file to write and nothing to commit for it — the report is the record.

## The report

An agent that found something stale says so at the end of its task, where the PL reads it. Each finding names:

| The finding says | Why it matters |
|---|---|
| **The file and the line** | Where the stale text is |
| **What it says now** | The current claim, quoted |
| **What is actually true** | The code, the ADR body, or the other file that contradicts it |
| **How it was found** | The check that disagreed, or the comparison that showed it |

**A finding without its evidence is an opinion.** "This looks out of date" is not a finding; "`SKILL.md:77` cites ADR-0002 for a rule ADR-0002's body explicitly retired" is.

The report lists findings and stops there. It does not ask whether they should be fixed — that is the PL's question to answer, and the PL answers it when the task is done.

## Fixing a finding, once the PL says so

A finding becomes work only when the PL asks for it. Then:

```
the PL approves a finding
  → the stale-fixer-agent takes it
  → it creates its own worktree, one per finding group
  → it fixes the documentation
  → the four checks, run in the worktree
  → a pull request, via the pull-request-agent
  → the human merges
```

**The `stale-fixer-agent` owns this work.** It is the only agent that edits the documentation for this reason.

The flow is the same as any other change: **its own worktree**, its own branch, its own pull request. The `worktree-constraints` rule applies to it exactly as it applies to the others — the fix happens in a worktree, not in the main checkout.

**One worktree per concern.** Two findings about the same file are one concern. Two findings about two unrelated files are two concerns and two pull requests.

## Never

- **Never fix stale documentation in passing.** Report it; the PL decides.
- **Never report a finding without its evidence.** The file, the line, and what contradicts it.
- **Never edit `CONTEXT.md` to match the code without the PL's word.** The glossary is the vocabulary; a term that changes meaning changes what the code is called.
- **Never fold a documentation fix into a feature's pull request.** It is a separate concern and it gets its own.
- **Never let a stale document stop the task.** The agent carries on with the work it was given and reports the finding at the end.
