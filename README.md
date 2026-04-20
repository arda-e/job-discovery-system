# job-discovery-system

Current scope: a minimal Lambda scaffold plus GitHub Actions deployment to an existing AWS Lambda function.

## Current behavior

The handler in `src/handler/discover.ts` delegates into `src/app/run-discovery.ts`.

By default, the Lambda runs a smoke path:

- logs `hello`
- waits 1 second
- logs `world`

The default response body is:

```json
{"message":"ok","mode":"smoke"}
```

You can later invoke the Lambda with:

```json
{"mode":"discover"}
```

That path currently returns a placeholder response and log line so the application skeleton can evolve without losing the fast smoke test.

## Runtime configuration

The Lambda now loads a minimal typed config from environment variables:

- `APP_ENV`: `dev` or `prod`, defaults to `dev`
- `LOG_LEVEL`: `debug`, `info`, `warn`, or `error`, defaults to `info`
- `EXA_SECRET_ID`: preferred for `discover` mode, points to an AWS Secrets Manager secret
- `EXA_API_KEY`: fallback for local development or temporary bootstrap only

Smoke mode does not require any GitHub or discovery-specific runtime configuration yet. The invocation logs include a sanitized config summary so deploys are still easy to validate without exposing secrets.

For this project, the intended production source of truth for API credentials is AWS Secrets Manager. The Lambda now prefers `EXA_SECRET_ID` and expects the referenced secret JSON to contain:

```json
{
  "EXA_API_KEY": "your-api-key"
}
```

Use plain `EXA_API_KEY` only as a minimal local-development or temporary bootstrap path.

## GitHub Actions deployment

The workflow at `.github/workflows/deploy-lambda.yml` deploys on pushes to `main` and on manual runs.

It:

1. installs dependencies
2. builds TypeScript into `dist/`
3. packages the compiled Lambda code into `build/lambda.zip`
4. assumes an AWS role via GitHub OIDC
5. updates the target Lambda function code
6. enforces `nodejs24.x`, `handler/discover.handler`, and a 5-second timeout

## Required GitHub configuration

Repository variables:

- `AWS_REGION`: target AWS region, for example `eu-central-1`
- `LAMBDA_FUNCTION_NAME`: existing Lambda function name, for example `job-discovery-system-discover`

Repository secret:

- `AWS_DEPLOY_ROLE_ARN`: IAM role ARN that GitHub Actions should assume

## Required AWS setup

Create an IAM role trusted by GitHub's OIDC provider and grant it at least:

- `lambda:UpdateFunctionCode`
- `lambda:UpdateFunctionConfiguration`
- `lambda:GetFunctionConfiguration`

The trust policy should scope access to this repository and branch.

Paste-ready examples are included here:

- [github-actions-oidc-trust-policy.json](/Users/arda/Desktop/development/job-discovery-system/infra/github-actions-oidc-trust-policy.json)
- [github-actions-deploy-policy.json](/Users/arda/Desktop/development/job-discovery-system/infra/github-actions-deploy-policy.json)
- [lambda-execution-secrets-policy.json](/Users/arda/Desktop/development/job-discovery-system/infra/lambda-execution-secrets-policy.json)
- [eventbridge-scheduler-trust-policy.json](/Users/arda/Desktop/development/job-discovery-system/infra/eventbridge-scheduler-trust-policy.json)
- [eventbridge-scheduler-invoke-policy.json](/Users/arda/Desktop/development/job-discovery-system/infra/eventbridge-scheduler-invoke-policy.json)
- [infra/README.md](/Users/arda/Desktop/development/job-discovery-system/infra/README.md)

Replace these placeholders before creating the role and policy:
- `<AWS_ACCOUNT_ID>`

Suggested setup sequence:

1. In AWS IAM, add the GitHub OIDC identity provider for `https://token.actions.githubusercontent.com` if it does not already exist.
2. Create an IAM role for GitHub Actions using `infra/github-actions-oidc-trust-policy.json` as the trust relationship.
3. Create and attach a policy using `infra/github-actions-deploy-policy.json`.
4. Put the new role ARN into the GitHub repository secret `AWS_DEPLOY_ROLE_ARN`.
5. Set GitHub repository variables `AWS_REGION` and `LAMBDA_FUNCTION_NAME`.
6. Push to `main` or run the `Deploy Lambda` workflow manually.

If your deploy branch is not `main`, change the `token.actions.githubusercontent.com:sub` value in the trust policy to the exact branch ref you want to allow.

## Local verification

```bash
npm ci
npm run build
npm run package:lambda
```

This produces compiled output in `dist/` and a deployable package directory in `build/lambda/`.
