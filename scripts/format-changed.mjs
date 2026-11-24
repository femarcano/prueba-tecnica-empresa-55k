#!/usr/bin/env node
/**
 * Format the files a change touches, and report what it rewrote.
 *
 * The agents verify with `pnpm format:check` rather than `pnpm format`,
 * because `format` rewrites every file in the repository and hides which
 * files the change actually touched. This script does the opposite of that:
 * it formats only the files the change touches, and it names every file it
 * rewrote, so the rewrite is visible in the diff.
 *
 * Usage:
 *   node scripts/format-changed.mjs            # format the changed files
 *   node scripts/format-changed.mjs --check    # report only, change nothing
 *   node scripts/format-changed.mjs --base main
 */

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** The formatter's binary, resolved from node_modules so it is on the path. */
const OXFMT = resolve(root, "node_modules/.bin/oxfmt");

/** The files oxfmt understands. Markdown is included on purpose. */
const FORMATTABLE =
  /\.(ts|tsx|js|jsx|mjs|cjs|json|jsonc|md|mdx|css|scss|html|vue|svelte|yaml|yml)$/;

/** The paths the formatter is configured to ignore — never touch these. */
const IGNORED = [
  /^\.github\//,
  /^docs\/adr\//,
  /^openapi\.yaml$/,
  /node_modules/,
  /\/__generated__\//,
];

function git(args, options = {}) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", ...options });
}

function parseArgs(argv) {
  const args = { check: false, base: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--check") args.check = true;
    else if (argv[i] === "--base") args.base = argv[++i];
  }
  return args;
}

/**
 * The files the change touches: staged, unstaged, and untracked.
 *
 * `git diff --name-only HEAD` covers the staged and the unstaged changes
 * against the current commit; `--others` adds the untracked files. The
 * merge base against `main` is used as well, so a branch's commits are
 * included and not only its working tree.
 */
function changedFiles(base) {
  const names = new Set();

  const add = (out) => {
    for (const line of out.split("\n")) {
      const name = line.trim();
      if (name) names.add(name);
    }
  };

  // The working tree: staged, unstaged, and untracked.
  add(git(["diff", "--name-only", "HEAD"]));
  add(git(["ls-files", "--others", "--exclude-standard"]));

  // The commits on this branch, against the base.
  const baseRef = base ?? defaultBase();
  if (baseRef) {
    try {
      add(git(["diff", "--name-only", `${baseRef}...HEAD`]));
    } catch {
      // No such ref — the working tree is all there is.
    }
  }

  return [...names];
}

/** The branch to compare against: `main` when it exists. */
function defaultBase() {
  try {
    git(["rev-parse", "--verify", "main"]);
    return "main";
  } catch {
    return null;
  }
}

function isFormattable(name) {
  if (!FORMATTABLE.test(name)) return false;
  if (IGNORED.some((pattern) => pattern.test(name))) return false;
  return true;
}

/** The formatter's own list, so the script never formats a file it would skip. */
function formatterIgnores(name) {
  try {
    const config = JSON.parse(readFileSync(resolve(root, ".oxfmtrc.json"), "utf8"));
    return (config.ignorePatterns ?? []).some((pattern) => {
      const re = new RegExp(
        "^" +
          pattern
            .replace(/[.+^${}()|[\]\\]/g, "\\$&")
            .replace(/\*\*\//g, "(?:.*/)?")
            .replace(/\*/g, "[^/]*") +
          "$",
      );
      return re.test(name);
    });
  } catch {
    return false;
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const candidates = changedFiles(args.base).filter(isFormattable);
  const files = candidates.filter((name) => !formatterIgnores(name));

  if (files.length === 0) {
    console.log("No formattable files in this change.");
    return;
  }

  const paths = files.map((name) => resolve(root, name));

  if (args.check) {
    // `--check` reports the files that are not formatted and exits non-zero.
    // `--list-different` cannot be combined with it, so the output is read
    // from the check itself.
    let output = "";
    let failed = false;
    try {
      output = execFileSync(OXFMT, ["--check", ...paths], {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      failed = true;
      output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
    }

    if (!failed) {
      console.log(`${files.length} file(s) in this change are correctly formatted.`);
      return;
    }

    console.error("These files in this change are not formatted:");
    for (const name of files) {
      if (output.includes(name)) console.error(`  ${name}`);
    }
    console.error("");
    console.error("Run `node scripts/format-changed.mjs` to format them.");
    process.exitCode = 1;
    return;
  }

  // Snapshot the files so the rewrite is visible afterwards.
  const before = new Map(paths.map((path) => [path, readFileSync(path, "utf8")]));

  execFileSync(OXFMT, [...paths], { cwd: root, stdio: "inherit" });

  const rewritten = paths.filter((path) => {
    if (!existsSync(path)) return false;
    return before.get(path) !== readFileSync(path, "utf8");
  });

  console.log(`Formatted ${files.length} file(s) in this change.`);
  if (rewritten.length > 0) {
    console.log("The formatter rewrote:");
    for (const path of rewritten) console.log(`  ${relative(root, path)}`);
  } else {
    console.log("The formatter rewrote nothing — the files were already correct.");
  }
}

main();
