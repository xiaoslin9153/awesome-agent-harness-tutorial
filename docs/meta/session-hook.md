# Session Hook

## Purpose

This file defines the minimum recording protocol for every working session. It is the mandatory hook for continuing this project.

## Session Start

1. Read `AGENTS.md`.
2. Read this file.
3. Read `docs/product/product-design.md`.
4. Read `docs/comparisons/framework-comparison-ledger.md`.
5. Check `docs/meta/sessions/` for an active session entry.
6. Create or reopen a session entry named `YYYY-MM-DD-short-topic.md`.
7. Record:
   - Session goal.
   - Scope in and out of scope.
   - Relevant records to update.
   - Initial assumptions.
   - Success criteria.

## During Work

After each meaningful step, update the session entry with:

1. What changed.
2. Why it changed.
3. Evidence or command output used.
4. Decisions made.
5. New assumptions.
6. Risks or unknowns.
7. Next action.

A meaningful step includes creating or changing a record, resolving a scope question, completing an analysis, discovering a blocker, or rejecting a proposed approach.

## Framework Work Hook

When analyzing Reasonix, DeepSeek Harness, or Pi:

1. Record the exact repository, release, commit, and access date.
2. Record whether each finding is `Verified`, `Inferred`, or `Unverified`.
3. Link evidence to `docs/comparisons/framework-comparison-ledger.md`.
4. Record questions that require another version, source file, experiment, or external confirmation.

## Session End

1. Complete `docs/meta/session-checklist.md`.
2. Ensure the session entry has:
   - Final outcome.
   - Files created or changed.
   - Decisions and rationale.
   - Evidence links.
   - Open questions.
   - Explicit next action.
3. Update affected durable records.
4. Mark the session `Completed`, `Paused`, or `Blocked`.
5. Do not leave a session in an unstated state.

## Minimum Quality Bar

A session record is insufficient if it only says "worked on docs" or "made progress." Another agent or person must be able to understand what happened, why, what remains, and where to resume.
