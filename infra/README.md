# IAM artifacts

This directory stores the IAM policy documents and trust relationships used by the current AWS setup.

## GitHub Actions deploy role

- `github-actions-oidc-trust-policy.json`
- `github-actions-deploy-policy.json`

Use these for the GitHub OIDC role that updates the Lambda from CI.

## Lambda execution role policy

- `lambda-execution-trust-policy.json`
- `lambda-execution-logging-policy.json`
- `lambda-execution-secrets-policy.json`

Use `lambda-execution-trust-policy.json` as the Lambda execution role trust relationship.

Attach these policies to the Lambda execution role:

- `lambda-execution-logging-policy.json`
- `lambda-execution-secrets-policy.json`

This covers CloudWatch logging plus reading the Exa credential from AWS Secrets Manager.

## EventBridge Scheduler role

- `eventbridge-scheduler-trust-policy.json`
- `eventbridge-scheduler-invoke-policy.json`

Use these for the EventBridge Scheduler role that invokes the Lambda on a recurring schedule.

## Coverage

The IAM artifacts in this directory now cover:

- GitHub Actions deployment of the Lambda
- Lambda runtime execution trust
- Lambda CloudWatch log writes
- Lambda Secrets Manager reads
- EventBridge Scheduler invocation of the Lambda

## Lambda Environment Variables

The Lambda runtime accepts two categories of environment variables: non-secret discovery profile fields and secret credentials.

### Discovery Profile Fields (non-secret)

These fields define search intent and are resolved at runtime into a structured discovery profile. The deploy workflow applies defaults when values are not provided.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DISCOVERY_ROLE_KEYWORDS` | Yes | `software engineer` | Comma-delimited role keywords for query generation (e.g., `software engineer, full stack, typescript`) |
| `DISCOVERY_EXCLUDED_ROLE_KEYWORDS` | No | _(empty)_ | Comma-delimited keywords to exclude (e.g., `senior, staff, principal`) |
| `DISCOVERY_LOCATION_CONSTRAINTS` | No | `remote` | Comma-delimited location constraints (e.g., `remote, united states`) |
| `DISCOVERY_COMPANY_PREFERENCES` | No | _(empty)_ | Comma-delimited company preferences (e.g., `stripe, shopify`) |
| `DISCOVERY_PRODUCT_SURFACE_PREFERENCE` | No | _(empty)_ | Comma-delimited product surface preferences (e.g., `jobs.lever.co, jobs.greenhouse.io`) |
| `DISCOVERY_END_TO_END_OWNERSHIP` | No | `false` | Whether to prefer end-to-end ownership signals (`true` or `false`) |
| `DISCOVERY_PREFERRED_TECH_STACK` | No | _(empty)_ | Comma-delimited preferred tech stack (e.g., `typescript, node.js, python`) |

### Secret Credentials

| Variable | Required | Description |
|----------|----------|-------------|
| `EXA_API_KEY` | Yes (one of) | Direct Exa API key for discover mode |
| `EXA_SECRET_ID` | Yes (one of) | AWS Secrets Manager secret ID for Exa API key lookup |

### Invocation Overrides

The invocation payload can override deployed defaults at runtime:

- `profile` — partial profile fields that merge with environment defaults
- `exaSearch.query` — explicit raw query override (validated, must not be blank)
- `exaSearch.numResults`, `exaSearch.maxCharacters`, `exaSearch.type` — Exa tuning overrides (validated, must be positive)

Override precedence: validated explicit query override > generated query from profile > Exa tuning defaults.

### Example Environment Block

```
DISCOVERY_ROLE_KEYWORDS=software engineer, full stack, typescript
DISCOVERY_EXCLUDED_ROLE_KEYWORDS=senior, staff, principal
DISCOVERY_LOCATION_CONSTRAINTS=remote
DISCOVERY_COMPANY_PREFERENCES=
DISCOVERY_PRODUCT_SURFACE_PREFERENCE=
DISCOVERY_END_TO_END_OWNERSHIP=true
DISCOVERY_PREFERRED_TECH_STACK=typescript, node.js
EXA_SECRET_ID=prod/exa/api-key
```

## Placeholders

Replace:

- `<AWS_ACCOUNT_ID>`

before creating policies and roles.
