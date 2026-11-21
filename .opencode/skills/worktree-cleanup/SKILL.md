---
name: worktree-cleanup
description: How to decide whether a worktree can be removed in this repository — is its branch merged, how old is it, and when to ask the PL before removing it. Use when cleaning up worktrees, after a branch is merged, or when the worktree list has grown.
---

# worktree-cleanup

A worktree is a scratch space for one change. Once the change is merged, the scratch space has no reason to exist — but removing it is not free: a worktree can hold uncommitted work, and a branch that was never merged holds the only copy of something.

This skill is the check that stands between "the branch is merged" and "delete it".

## The three questions

Every worktree gets three answers before anything is removed.

| Question | How it is answered |
|---|---|
| **Is the branch merged?** | Two checks, because a squash merge breaks the first one — see below. |
| **How old is it?** | Days since the branch was last worked on. |
| **Does it hold unsaved work?** | `git status --porcelain` in the worktree. |

## Is the branch merged

**The ancestor check** — did the branch's commits reach `main` as they were?

```console
$ git merge-base --is-ancestor <branch> main && echo merged || echo "not merged"
```

This is the right question for a normal merge or a rebase. It is **not** enough on its own: GitHub squash-merges, and a squash merge writes a **new commit** on `main` with the branch's changes and none of its history. The branch's commits are not ancestors of `main`, even though every line of their work is in it.

**The content check** — is the branch's content already in `main`?

```console
$ git diff <branch> main --stat
```

Empty output means the branch contributes nothing that `main` does not already have. That is the squash-merged branch.

**Read them together:**

| Ancestor | Content | What it means |
|---|---|---|
| merged | differs | **Merged**, and the branch has changes `main` does not have. The extra changes are something else — read them before touching it. |
| merged | identical | **Merged cleanly.** Safe to remove. |
| not merged | identical | **Squash-merged.** Safe to remove — this is the case the ancestor check alone gets wrong. |
| not merged | differs | **Not merged.** The branch holds work that is nowhere else. Do not remove it. Report it. |

## How old is it

Days since the branch was last worked on. Take the **oldest** of the tip commit's author date and its committer date, and the upstream's dates when the branch has one:

```console
$ git log -1 --format="%at %ct" <branch> \
    | awk '{if ($1<$2) print $1; else print $2}' \
    | awk -v now="$(date +%s)" '{printf "%d days\n", (now-$1)/86400}'
```

**Why the oldest of the two.** The author date is when the work was written; the committer date is when the commit was written. They are the same for an ordinary commit. They differ when the commit was rebased or amended — and then the committer date is the moment of the rewrite, which says nothing about how old the *work* is. Taking the oldest of the two reports the age of the work, and it cannot be gamed by rewriting the history.

For a branch with an upstream, the remote copy can be newer than the local one. Take the newer of the two — a branch that was worked on and pushed is not stale:

```console
$ git rev-parse --abbrev-ref "<branch>@{upstream}" 2>/dev/null
```

A branch with no upstream has no remote copy, and the local dates are all there is.

**Two weeks means 14 calendar days.** That is the threshold: at 14 days or more the worktree is **stale**.

## When to ask

The checks are read **in this order**. A branch that is not merged is reported and left alone whatever its age — there is no point asking about removing something that holds work that exists nowhere else.

| # | State | Stale? | What to do |
|---|---|---|---|
| 1 | Not merged, any age | — | **Do not remove it.** Report it. The branch holds work that exists nowhere else. |
| 2 | Merged, but with changes `main` does not have | — | **Read the extra changes first.** The branch was merged and then something else was committed on it. |
| 3 | Merged, 14 days or more | yes | **Ask the PL before removing it.** Report the age and the merged state, and let them decide. |
| 4 | Merged, under 14 days | no | **Remove it.** No need to ask. |

**Ask, then wait.** The question is not a formality — the answer may be "keep it, I still want to look at it" or "remove it, I have it on another machine". Report what you found, ask, and act on the answer.

## Removing it

```console
$ git worktree remove ../prueba-tecnica-empresa-55k-worktrees/<name>
```

`git worktree remove` refuses to delete a worktree with uncommitted changes. That refusal is the check working — read its message and report the dirty files rather than reaching for `--force`.

**Removing the worktree does not delete the branch.** That is deliberate: the branch is what the pull request lives on, and deleting it is a separate decision. If the branch is merged and the pull request is closed, the branch can go too — but that is its own step, not a side effect of this one.

## Never, when cleaning up

- **Never remove a worktree whose branch is not merged.** Report it instead.
- **Never use `--force` to remove a worktree with uncommitted changes.** Those changes are the user's work.
- **Never remove the main checkout.** It is the first entry in `git worktree list`, and it is the one that is not a worktree.
- **Never delete a branch that still has an open pull request.**
- **Never ask about a worktree that is younger than 14 days.** The threshold exists so the question is rare enough to be worth asking.

## The worktree list

```console
$ git worktree list --porcelain
```

```
worktree /Users/femarcano/Projects/prueba-tecnica-empresa-55k
HEAD 71403a537840980dab06b2dfde3a7ac638d01230
branch refs/heads/main

worktree /Users/femarcano/Projects/prueba-tecnica-empresa-55k-worktrees/feat-header-accessibility
HEAD 24e09db8f3e2b1c9d4a5f6e7b8c9d0e1f2a3b4c5d
branch refs/heads/feat/header-accessibility
```

**The first entry is the main checkout, not a worktree.** Skip it. The rest are the worktrees this skill is about.

## Finding the path of a worktree

The worktree's folder name is its branch name with the slashes turned into dashes, under the sibling folder named after the project:

```console
$ git worktree list --porcelain | grep -E "^worktree |^branch "
```

To go from a branch to its worktree, the mapping is mechanical:

```
feat/header-accessibility  →  ../prueba-tecnica-empresa-55k-worktrees/feat-header-accessibility/
```

## Completion criteria

- Every worktree except the main checkout has a merged verdict, an age, and a dirty verdict.
- Worktrees that are merged and under 14 days are removed.
- Worktrees that are 14 days or older have been reported to the PL with their age and merged state, and the removal happened only after the answer.
- Worktrees that are not merged are reported and left alone.
- The final `git worktree list` shows the main checkout and whatever was kept.
