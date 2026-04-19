import Exa from "exa-js";

export type ExaGetContentsInput = {
  urls: string[];
  maxCharacters?: number;
};

/**
 * Creates a minimal Exa SDK client for discovery integrations.
 */
export const createExaClient = (apiKey: string): Exa => new Exa(apiKey);

/**
 * Fetches document contents from Exa for a set of known URLs.
 */
export const getExaContents = async (
  apiKey: string,
  input: ExaGetContentsInput
) =>
  createExaClient(apiKey).getContents(input.urls, {
    highlights: {
      maxCharacters: input.maxCharacters ?? 4_000
    }
  });
