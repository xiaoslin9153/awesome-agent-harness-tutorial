# Framework Comparison Ledger

## Status

- Version: v0.1
- Date: 2026-08-22
- Canonical scope: Reasonix, DeepSeek Harness (`dsh`), Pi

## Purpose

This ledger is the single source of truth for comparison scope, criteria, evidence rules, and current conclusions. New framework observations must be added here or linked from here.

## Evidence Rules

1. Record the framework name, repository or product source, version, commit, and access date.
2. Separate `Verified`, `Inferred`, and `Unverified` findings.
3. `Verified` requires a source path, public document, reproducible experiment, or captured transcript.
4. `Inferred` requires explicit reasoning and the evidence it is based on.
5. `Unverified` items are hypotheses, not conclusions.
6. Do not compare different versions as though they have identical behavior.
7. Update conclusions when the canonical version changes.

## Target Inventory

| Framework | Canonical target | Version / commit | Access date | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Reasonix | Unresolved | Unresolved | Unresolved | Pending | Need to select product, repository, and version. |
| DeepSeek Harness (`dsh`) | Unresolved | Unresolved | Unresolved | Pending | Need to select repository, release, and protocol version. |
| Pi | Unresolved | Unresolved | Unresolved | Pending | Need to select implementation and version. |

## Comparison Dimensions

| ID | Dimension | Core question | Status |
| --- | --- | --- | --- |
| C01 | Positioning | What execution environment and user surface does it target? | Pending |
| C02 | Architecture | What are the major components and ownership boundaries? | Pending |
| C03 | Run lifecycle | How does a run move from input to final result? | Pending |
| C04 | State model | What states exist and who owns transitions? | Pending |
| C05 | Context assembly | What is included in the model request and in what order? | Pending |
| C06 | Context policy | How are history, tools, files, and results compressed or truncated? | Pending |
| C07 | Prompt strategy | How are system, developer, project, tool, and runtime instructions layered? | Pending |
| C08 | Tool model | How are tools declared, selected, validated, and dispatched? | Pending |
| C09 | Tool execution | Where does execution happen and how are side effects controlled? | Pending |
| C10 | Result handling | How are large, malformed, streaming, and failed results returned? | Pending |
| C11 | Event model | What events exist, in what order, and with what delivery guarantees? | Pending |
| C12 | Streaming | How are partial output and tool progress represented? | Pending |
| C13 | Approval model | Which actions require approval and how is denial handled? | Pending |
| C14 | Security and sandbox | How are filesystem, network, process, and prompt-injection risks controlled? | Pending |
| C15 | Concurrency | How are parallel tool calls and sub-agents coordinated? | Pending |
| C16 | Multi-agent | How are agents spawned, addressed, scoped, and joined? | Pending |
| C17 | Persistence | What is stored, when, and how is consistency maintained? | Pending |
| C18 | Resume and cancellation | What can be resumed, retried, rolled back, or must be abandoned? | Pending |
| C19 | Failure handling | How are model, tool, transport, validation, and state errors handled? | Pending |
| C20 | Observability | What traces, logs, metrics, and replay artifacts are produced? | Pending |
| C21 | Extensibility | Which tools, hooks, policies, models, and runtimes can be replaced? | Pending |
| C22 | Testability | How can model, tools, time, transport, and side effects be mocked or replayed? | Pending |
| C23 | Cost and latency | How do design choices affect tokens, calls, queueing, and wall time? | Pending |
| C24 | Evaluation | What task, safety, efficiency, and recovery signals are supported? | Pending |
| C25 | Deployment | How do CLI, IDE, Web, server, and worker constraints shape design? | Pending |

## Current Working Conclusions

No framework-specific conclusion has been verified yet. The first analysis task is to resolve the canonical target and version for each framework.

## Decision Log

| Date | Decision | Reason | Impact |
| --- | --- | --- | --- |
| 2026-08-22 | Establish 25 stable comparison dimensions. | Prevent later framework notes from becoming incompatible feature lists. | All future analyses must map findings to C01-C25. |
