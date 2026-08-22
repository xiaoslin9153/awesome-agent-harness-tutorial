# Product Design

## Status

- Version: v0.1
- Date: 2026-08-22
- State: Draft for review

## Product Positioning

A long-term, publishable learning system for Agent Harness engineering. The project is not only a personal notebook; it should become a structured tutorial that explains concepts, compares mainstream implementations, demonstrates runnable experiments, records failure modes, and supports interview preparation.

## Target Users

1. The repository owner, as the primary learner and maintainer.
2. Engineers who want to understand how Agent Harnesses work internally.
3. Interview candidates preparing for Agent platform, runtime, infrastructure, or applied-model engineering roles.
4. Later public readers through GitHub Pages or another static-site host.

## Product Goals

1. Build a complete mental model of an Agent Harness.
2. Explain every important mechanism, engineering tradeoff, and common failure mode in enough detail to teach others.
3. Analyze Reasonix, DeepSeek Harness, and Pi with a consistent methodology.
4. Extract transferable design patterns rather than producing shallow feature lists.
5. Create a practical interview question bank with reasoning chains.
6. Preserve every long-running decision and session outcome in Markdown.
7. Remain publishable as a static website without requiring a rewrite.

## Non-Goals for Now

1. Building a production Agent Harness.
2. Ranking frameworks by marketing claims.
3. Reimplementing complete external projects.
4. Publishing private code, credentials, or confidential material.
5. Optimizing the public website before the learning content stabilizes.

## Content Architecture

```text
docs/
  product/
    product-design.md
  comparisons/
    framework-comparison-ledger.md
  meta/
    session-hook.md
    session-checklist.md
    sessions/
  00-overview.md
  01-core-concepts/
  02-harness-mechanics/
  03-frameworks/
  04-comparisons/
  05-labs/
  06-case-studies/
  07-interview/
  08-evaluation/
  09-glossary/
```

Directories above are the target structure. They may be created only when the corresponding content exists.

## Core Learning Tracks

### Track 1: Concepts and Mental Models

Explain the boundaries between model, agent, harness, runtime, tools, application, and infrastructure. Define session, turn, run, event, tool call, approval, interruption, resume, and trace.

### Track 2: Harness Mechanics

Study prompt assembly, context construction, context compression, tool schemas, tool execution, result truncation, streaming, cancellation, retries, approvals, sandboxing, persistence, checkpointing, observability, memory, workspace access, and multi-agent delegation.

### Track 3: Framework Dissection

Use one shared template to analyze Reasonix, DeepSeek Harness, and Pi. Each analysis should identify entry points, run loop, context policy, tool protocol, execution model, event model, persistence model, failure handling, security boundary, extension points, and testability.

### Track 4: Horizontal Comparison

Compare the three systems mechanism by mechanism. Produce both narrative analysis and a stable comparison table.

### Track 5: Labs and Case Studies

Create minimal experiments for each core mechanism. Record expected behavior, actual behavior, root cause, fix, and transferable lesson.

### Track 6: Interview Preparation

Build questions across concepts, architecture, implementation, debugging, security, evaluation, and system design. Each question should include the assessment target, reference answer, follow-up chain, and common incorrect answers.

### Track 7: Evaluation and Publishing

Define how to judge harness quality and how to organize the repository for a static-site release.

## Framework Analysis Template

Every framework analysis should answer:

1. What problem does the harness solve?
2. What is the entry point and initialization sequence?
3. What is the agent run loop?
4. How is the system prompt assembled?
5. How is context selected, compressed, truncated, and persisted?
6. How are tools declared, selected, invoked, and results returned?
7. How are streaming events represented and consumed?
8. How are approvals, permissions, and sandbox boundaries enforced?
9. How are retries, timeouts, cancellation, and resume handled?
10. What is persisted, when, and with what consistency guarantees?
11. How are errors, partial output, and unsafe states handled?
12. How is execution observed, traced, replayed, and evaluated?
13. How are sub-agents, delegation, and parallel work modeled?
14. What extension points exist?
15. What is strong, weak, risky, and worth borrowing?

## Comparison Dimensions

The canonical dimensions are maintained in `docs/comparisons/framework-comparison-ledger.md`.

## Milestones

### Phase 1: Knowledge Foundation

- Create product design and comparison ledger.
- Establish session recording protocol.
- Write the glossary skeleton.
- Write the canonical article: "Lifecycle of an Agent Run".

### Phase 2: Harness Mechanics

- Write mechanism chapters for context, tools, events, execution, approval, persistence, cancellation, resume, and observability.
- Add one minimal lab per mechanism.

### Phase 3: Individual Framework Analysis

- Inventory public materials and source code for Reasonix, DeepSeek Harness, and Pi.
- Complete one architecture map per framework.
- Record verified code paths and unresolved questions separately.

### Phase 4: Horizontal Comparison

- Complete the comparison ledger.
- Publish mechanism-level comparison articles.
- Extract reusable design patterns and anti-patterns.

### Phase 5: Labs and Interview Bank

- Expand runnable experiments.
- Build categorized interview questions and answer chains.
- Add a debugging playbook.

### Phase 6: Website Release

- Choose Astro Starlight or Docusaurus.
- Generate the site from Markdown.
- Add navigation, search, versioning, and deployment.

## Success Criteria

1. A new reader can understand the complete Agent Run lifecycle without prior context.
2. Each framework analysis uses the same template and separates verified facts from interpretation.
3. Each core mechanism has at least one reproducible lab or explicit reason why it cannot yet run locally.
4. Each interview question includes reasoning, follow-ups, and common mistakes.
5. Session records allow work to resume without losing context.
6. Markdown can be published as a website with minimal transformation.

## Open Questions

1. Which exact Reasonix repository or product version should be the first analysis target?
2. Which DeepSeek Harness repository, release, and protocol version should be canonical?
3. Which Pi implementation and version should be canonical?
4. Should the public site include Chinese, English, or bilingual content?
5. Should labs use one shared language and runtime, or adapt to each framework?
