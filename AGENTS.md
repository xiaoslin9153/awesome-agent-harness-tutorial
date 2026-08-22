# Agent Working Agreement

## Project Goal

Build a long-term, publishable learning repository about Agent Harnesses. The repository must preserve product design decisions, framework comparisons, implementation experiments, pitfalls, and interview preparation as durable Markdown records.

## Required Reading

- Before doing any substantive work, read `docs/meta/session-hook.md`.
- Before updating product scope, framework scope, comparison criteria, or publishing strategy, read `docs/product/product-design.md` and `docs/comparisons/framework-comparison-ledger.md`.

## Session Protocol

1. Open or continue the current session entry in `docs/meta/sessions/`.
2. Record the session goal before making non-trivial changes.
3. Update the session entry after each meaningful step, including completed work, decisions, evidence, open questions, and next actions.
4. Before ending the session, complete `docs/meta/session-checklist.md`.
5. If the session cannot complete a planned step, record the exact blocker and the next concrete action.

## Documentation Rules

- Prefer Markdown for durable project knowledge.
- Keep one idea per document where practical.
- Use stable filenames and relative links.
- Do not replace prior conclusions silently; append a dated decision or create a revision section.
- Mark uncertain claims as `Unverified` and list what evidence is needed.
- Separate facts from interpretation.
- Every framework comparison must use `docs/comparisons/framework-comparison-ledger.md` as the canonical criteria source.
- Every session must leave enough context for another person or agent to resume without asking questions.

## Repository Layout

```text
AGENTS.md
docs/
  product/
  comparisons/
  meta/
    sessions/
```

## Git And Remote Policy

- Use Git as the durable history mechanism in addition to Markdown records.
- Commit only intentional, self-contained changes.
- Write commit messages using Conventional Commits.
- Push through the SSH host alias `github.com-personal`, which is configured for GitHub account `xiaoslin9153` with `~/.ssh/[removed-key-identifier]`.
- Use remote URL `git@github.com-personal:xiaoslin9153/awesome-agent-harness-tutorial.git`.
- Do not use the default `github.com` alias, because it selects the work identity key instead of this project's personal key.

## Current Status

The repository is in the product-design and knowledge-architecture phase. No framework source analysis has been completed yet.
