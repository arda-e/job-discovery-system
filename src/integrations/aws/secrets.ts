import {
  GetSecretValueCommand,
  SecretsManagerClient
} from "@aws-sdk/client-secrets-manager";

export type ExaSecretPayload = {
  EXA_API_KEY?: string;
};

const client = new SecretsManagerClient({});

/**
 * Loads and parses a JSON secret from AWS Secrets Manager.
 */
export const getJsonSecret = async <T>(secretId: string): Promise<T> => {
  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: secretId
    })
  );

  if (!response.SecretString) {
    throw new Error(`Secret ${secretId} did not contain a SecretString value`);
  }

  return JSON.parse(response.SecretString) as T;
};

/**
 * Resolves the Exa API key from Secrets Manager.
 */
export const getExaApiKeyFromSecret = async (
  secretId: string
): Promise<string> => {
  const secret = await getJsonSecret<ExaSecretPayload>(secretId);

  if (!secret.EXA_API_KEY) {
    throw new Error(`Secret ${secretId} did not contain EXA_API_KEY`);
  }

  return secret.EXA_API_KEY;
};
