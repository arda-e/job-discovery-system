# AGENTS.md

## Project

This repository is for the `job-discovery-system` project: a serverless discovery layer that finds relevant job opportunities and appends normalized entries into a shared `portals.yml` contract consumed by `career-ops`.

The repository is currently in the planning phase. Most of the existing content is requirements, implementation planning, and condensed API reference notes.

## Current Source of Truth

- Requirements: `2026-04-19-job-discovery-system-architecture-requirements.md`
- Plan: `docs/plans/2026-04-19-001-feat-job-discovery-system-plan.md`
- External reference notes: `docs/reference/`

When planning or implementing, treat the requirements doc as the product source of truth and the plan as the current implementation guide.

## Expected Architecture

The planned system has these major areas:

- contract and config parsing
- ATS adapters
- Brave and Exa search adapters
- policy engine for eligibility, scoring, and suppression
- GitHub writer and seen-cache state
- Lambda handler and infrastructure

Until code exists, do not assume file paths beyond what is documented in the plan.

## Working Rules

- Preserve the append-only contract for `portals.yml`.
- Do not weaken the canonical `company_slug` identity model without explicitly updating the requirements and plan.
- Treat non-ATS discoveries as leads, not normal scan targets, unless the requirements change.
- Keep secrets out of source control.
- Prefer deterministic writes and dry-run-safe behavior for any write-path work.

## Documentation Rules

- Keep architecture or policy changes reflected in both:
  - `2026-04-19-job-discovery-system-architecture-requirements.md`
  - `docs/plans/2026-04-19-001-feat-job-discovery-system-plan.md`
- Add new vendor or API research under `docs/reference/` rather than scattering notes through random files.

## Implementation Notes

- The plan currently assumes a Node.js/TypeScript Lambda on `nodejs24.x`.
- EventBridge Scheduler is the intended scheduling surface.
- GitHub Contents API is the intended write mechanism.
- S3 is the intended store for the seen-cache.
- Secrets Manager is the intended store for API credentials.

## Status

This file is intentionally a skeleton. Expand it as the repository gains real source files, scripts, deployment tooling, and test conventions.
