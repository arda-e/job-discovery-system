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

## Placeholders

Replace:

- `<AWS_ACCOUNT_ID>`

before creating policies and roles.
