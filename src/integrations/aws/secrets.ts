import {
  GetSecretValueCommand,
  SecretsManagerClient,
  type SecretsManagerClientConfig
} from "@aws-sdk/client-secrets-manager";

export type ExaSecretPayload = {
  EXA_API_KEY?: string;
};

export class SecretsService {
  private readonly client: SecretsManagerClient;

  constructor(config: SecretsManagerClientConfig = {}) {
    this.client = new SecretsManagerClient(config);
  }

  /**
   * Loads and parses a JSON secret from AWS Secrets Manager.
   */
  async getJsonSecret<T>(secretId: string): Promise<T> {
    const response = await this.client.send(
      new GetSecretValueCommand({
        SecretId: secretId
      })
    );

    if (!response.SecretString) {
      throw new Error(`Secret ${secretId} did not contain a SecretString value`);
    }

    return JSON.parse(response.SecretString) as T;
  }

  /**
   * Resolves the Exa API key from Secrets Manager.
   */
  async getExaApiKey(secretId: string): Promise<string> {
    const secret = await this.getJsonSecret<ExaSecretPayload>(secretId);

    if (!secret.EXA_API_KEY) {
      throw new Error(`Secret ${secretId} did not contain EXA_API_KEY`);
    }

    return secret.EXA_API_KEY;
  }
}

export const secretsService = new SecretsService();
