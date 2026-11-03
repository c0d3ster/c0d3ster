# c0d3ster Tasks

Instructions for agent: This file is the task inventory only. Workflow rules (branching, PRs, testing, archival, NEEDS HUMAN annotations) live in CLAUDE.md under "Overnight Agent Workflow". Work through Agent-Ready tasks in order. Do not attempt Decisions items; those require human input.

Spec reference: docs/INVOICE_BILLING_EPIC.md defines the full invoicing pipeline across 7 phases with file locations, schemas, acceptance criteria, and implementation notes. Tasks below reference it by phase. If the doc and this file conflict, the doc wins; annotate the conflict here.

Invoice implementation rule (from doc): never hand-write migration SQL — edit the model then run db:generate. Never run db:migrate without explicit user approval; annotate NEEDS HUMAN when that step is reached.

## Agent-Ready

## Research (agent can draft findings, human decides)

## Decisions (human only, do not attempt)

- [ ] #12 [stack: solo] Should project type move into advanced request options and be intelligently selected?
- [ ] #13 [stack: solo] Client acquisition calls: Alec, Kelly, one more Edgehill contact (James?).

## Discovered

<!-- Agent: add newly discovered work here during sessions, one line + location. Do not implement in the same session. -->
