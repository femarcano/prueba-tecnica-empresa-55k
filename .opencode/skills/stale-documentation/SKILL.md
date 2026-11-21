---
name: stale-documentation
description: How to find, report and fix stale documentation in this repository — the rules, the skills, CONTEXT.md, NOTES.md and the ADRs. Use when an agent reads a rule or a skill and finds it out of date, when reporting findings to the PL, or when fixing an approved finding.
---

# stale-documentation

The rules, the skills, `CONTEXT.md`, `NOTES.md` and the ADRs describe a repository that moves. This skill is how the description is kept true.

It has three parts, and they happen at different times:

| Part | When |
|---|---|
| **Finding** | While an agent is doing its own task |
| **Reporting** | When that task is done |
| **Fixing** | Only after the PL approves a finding |

## Finding

Read the documentation as part of the task. Whenever a rule, a skill, the glossary, the notes or an ADR says something the code does not agree with, **record it and carry on**. The task is not blocked and the file is not edited.

### What to look for

| The tell | What it means |
|---|---|
| A skill shows a file, a folder or a symbol that does not exist | The example drifted from the code |
| A skill's worked sample contradicts its own `SKILL.md` | The prose was updated and the artifact was not |
| A rule, a skill or an agent cites an ADR for a rule that ADR retired | The citation points at the wrong decision |
| `NOTES.md` records a gap that has since been closed | The note is out of date |
| `NOTES.md` or `CONTEXT.md` uses a term the code no longer uses | The vocabulary drifted |
| An ADR's **filename** names a decision its **body** rejects | The title was left over from an earlier world |
| A skill describes a mechanism that was removed | The rule points at a thing that is gone |
| Two skills give opposite instructions for the same thing | One of them is wrong |
| An agent definition tells the agent to do something its scope forbids | The two contradict each other |

### The checks that find these

The four checks are blind to the documentation: `pnpm lint` is `oxlint src`, and `.oxfmtrc.json` puts `.opencode/**` in `ignorePatterns`. Nothing in the toolchain validates a rule or a skill.

These find it instead:

```console
$ git diff --stat <merge-base>..main -- .opencode/ NOTES.md CONTEXT.md docs/adr/
```

What changed in the documentation since the document was written. A file that changed while a document still describes the old state is the usual cause.

```console
$ grep -rn "src/repositories\|OrdersRepository\|repository:" .opencode/skills/ --exclude-dir=stale-documentation
```

The patterns that a deleted seam leaves behind. The concrete names come from the ADRs in `docs/adr/`.

**Exclude this skill's own directory.** It quotes the patterns it searches for, so it matches itself. Use `--exclude-dir=stale-documentation`, not `--exclude=SKILL.md`: that flag matches by **basename**, so it would exclude every skill file in the repository.

**Compare the document against the code.** The skill says a file exists; read the file. The ADR says a rule was retired; read the ADR's body, not only its filename.

## Reporting

The finding goes in the agent's own report, at the end of the task. **Nothing is written to disk** — the report is the record.

Each finding carries four things:

```text
FILE      .opencode/skills/feature-presentation/SKILL.md:55
CLAIMS    <h1>Test</h1>
ACTUALLY   The heading is "Users" — src/features/UserList/presentations/index.tsx
EVIDENCE  The header was rewritten in PR #61; the skill still shows the old markup
```

| The field | What goes in it |
|---|---|
| **FILE** | The path and the line number |
| **CLAIMS** | The current text, quoted |
| **ACTUALLY** | What is true, and where the truth is |
| **EVIDENCE** | The check that disagreed, or the comparison that showed it |

**A finding without evidence is an opinion.** "This looks out of date" is not a finding.

**Report everything out of date** — the contradictions, the harmless wording, the historical notes that no longer describe anything. The PL decides what is worth changing. The agent does not filter.

**The report ends with the findings.** It does not ask whether they should be fixed. That question belongs to the PL, and it is answered when the task is done.

### What a finding is not

| Not a finding | Why |
|---|---|
| A preference for different wording | That is a style opinion, not staleness |
| A missing rule | A rule that was never written is a gap, not stale documentation |
| A historical note that is still true | History does not expire |
| A finding about the code | That is a defect, and it belongs to whoever fixes defects |

## Fixing

**Only after the PL approves.** The PL picks the findings worth fixing, and the `stale-fixer-agent` takes them.

### Group the findings into concerns

**One concern per pull request.** A concern is a set of findings that would be reverted together.

| The findings | The concern | The pull request |
|---|---|---|
| Two findings in the same file | One | One |
| One finding in a skill, one in an unrelated ADR | Two | Two |

Would reverting them together roll back something unrelated? If yes, they are two concerns.

### The flow

```
the PL approves a finding
  → create the worktree (one per concern)
  → fix the documentation in the worktree
  → the four checks, run in the worktree
  → the pull-request-agent opens the pull request
  → the human merges
```

**The fix happens in a worktree**, exactly like any other change — see the `worktree-constraints` rule. A fresh worktree needs `pnpm orval` before the checks pass.

### How to fix each kind

| The finding | The fix |
|---|---|
| A skill shows code that no longer exists | Update the code in the skill to the current form. Do not delete the example — it is the teaching material. |
| A skill's sample contradicts its own prose | Bring the sample in line with the prose. The prose is the rule; the sample is the artifact. |
| A citation points at a retired rule | Cite the rule that is in force. If the ADR's own title is wrong, rename the file and say so in the report — a rename is a link change for anyone who cited it. |
| `NOTES.md` records a closed gap | Remove the entry, or rewrite it to describe what is there now. |
| A term in `CONTEXT.md` no longer matches the code | **Ask the PL which term is right.** The vocabulary is a decision, not a typo. |
| Two skills contradict each other | Bring the weaker one in line with the stronger, and report which was changed and why. |

**A rename is not a silent change.** Renaming a file or a term breaks every citation to it. Report it, and let the PL know what has to follow.

### The verification that matters

The four checks do not read the documentation. So verify the fix by hand:

```console
$ grep -rn "src/repositories\|OrdersRepository" .opencode/skills/ --exclude-dir=stale-documentation
$ grep -rn "h1>Test\|toggle Colors" .opencode/skills/ --exclude-dir=stale-documentation
```

The pattern that was there must be gone. And for a code example in a skill, read the file it points at and check that the example still matches it.

## Never

- **Never fix stale documentation in passing.** Report it; the PL decides.
- **Never report a finding without its evidence.**
- **Never edit the vocabulary without the PL's word.**
- **Never fold a documentation fix into a feature's pull request.**
- **Never let a stale document stop the task.**
