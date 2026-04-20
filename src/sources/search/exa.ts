import Exa from "exa-js";
import type { DiscoveryCandidate } from "../../domain/discovery-candidate";

export type ExaSearchInput = {
  query: string;
  maxCharacters?: number;
  numResults?: number;
  type?: "auto" | "fast" | "instant" | "deep-lite" | "deep" | "deep-reasoning";
};

/**
 * Creates a minimal Exa SDK client for discovery integrations.
 */
export const createExaClient = (apiKey: string): Exa => new Exa(apiKey);

/**
 * Runs a search request through Exa with highlight contents enabled.
 */
export const searchExa = async (
  apiKey: string,
  input: ExaSearchInput
) =>
  createExaClient(apiKey).search(input.query, {
    type: input.type ?? "deep",
    numResults: input.numResults ?? 3,
    contents: {
      highlights: {
        maxCharacters: input.maxCharacters ?? 4_000
      }
    }
  });

/**
 * Normalizes Exa search results into a small logging-friendly shape.
 */
export const normalizeExaResults = (
  results: Array<{
    title?: string | null;
    url: string;
    publishedDate?: string;
    highlights?: string[];
  }>
): DiscoveryCandidate[] =>
  results.map((result) => ({
    title: result.title ?? undefined,
    url: result.url,
    publishedDate: result.publishedDate,
    highlightPreview: result.highlights?.[0]
  }));
