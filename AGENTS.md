# AGENTS.md

## Project

This repository is for the `job-discovery-system` project: a serverless discovery worker that finds relevant job opportunities for `career-ops`.

The tracked repository now focuses on the runnable worker, tests, deployment flow, and public-facing architecture summary in [README.md](/Users/arda/Desktop/development/job-discovery-system/README.md).

## Public Source Of Truth

- Public overview and deploy/use guidance: [README.md](/Users/arda/Desktop/development/job-discovery-system/README.md)
- The tracked architecture requirements document in the repository
- The tracked future-architecture note in the repository, when present

Detailed planning notes and condensed vendor reference notes may exist locally, but they are intentionally not part of the tracked remote repository.

## Expected Architecture

The implemented and planned system centers on:

- Lambda handler and runtime config
- search adapters
- candidate filtering and aggregation
- future dedupe and append-only write path for `portals.yml`
- infrastructure for deploy, secrets, and scheduling

## Working Rules

- Preserve the append-only contract for `portals.yml`.
- Do not weaken the canonical `company_slug` identity model without explicitly updating the requirements doc.
- Treat non-ATS discoveries as leads, not normal scan targets, unless the requirements change.
- Keep secrets out of source control.
- Prefer deterministic writes and dry-run-safe behavior for any write-path work.

## Documentation Rules

- Keep public behavior, deploy flow, and usage instructions reflected in `README.md`.
- Keep architecture and policy changes reflected in the tracked architecture requirements document.
- Add new tracked technical docs under a stable public docs path or `infra/` when they are meant to stay in the public repository.

## Implementation Notes

- The deploy workflow configures the Lambda as `nodejs24.x`.
- EventBridge Scheduler is the intended scheduling surface.
- GitHub Contents API is the intended write mechanism once the append path is implemented.
- S3 is the intended store for the seen-cache once persistence is added.
- Secrets Manager is the intended store for API credentials.
