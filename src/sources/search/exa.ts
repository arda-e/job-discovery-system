import Exa from "exa-js";
import type { DiscoveryCandidate } from "../../domain/discovery-candidate";

export type ExaSearchInput = {
  query: string;
  maxCharacters?: number;
  numResults?: number;
  type?: "auto" | "fast" | "instant" | "deep-lite" | "deep" | "deep-reasoning";
};

export class ExaSearchAdapter {
  private readonly client: Exa;

  constructor(apiKey: string) {
    this.client = new Exa(apiKey);
  }

  /**
   * Runs a search request through Exa with highlight contents enabled.
   */
  async search(input: ExaSearchInput) {
    return this.client.search(input.query, {
      type: input.type ?? "deep",
      numResults: input.numResults ?? 3,
      contents: {
        highlights: {
          maxCharacters: input.maxCharacters ?? 4_000
        }
      }
    });
  }

  /**
   * Normalizes Exa search results into a small logging-friendly shape.
   */
  normalizeResults(
    results: Array<{
      title?: string | null;
      url: string;
      publishedDate?: string;
      highlights?: string[];
    }>
  ): DiscoveryCandidate[] {
    return results.map((result) => ({
      title: result.title ?? undefined,
      url: result.url,
      publishedDate: result.publishedDate,
      highlightPreview: result.highlights?.[0]
    }));
  }
}
