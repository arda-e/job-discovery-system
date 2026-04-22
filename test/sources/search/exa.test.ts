import Exa from "exa-js";
import { ExaSearchAdapter } from "../../../src/sources/search/exa";

jest.mock("exa-js", () => jest.fn());

describe("ExaSearchAdapter", () => {
  const searchMock = jest.fn();
  const ExaMock = Exa as unknown as jest.Mock;

  beforeEach(() => {
    ExaMock.mockClear();
    ExaMock.mockImplementation(() => ({
      search: searchMock
    }));
    searchMock.mockReset();
  });

  it("passes the default search options to the SDK", async () => {
    searchMock.mockResolvedValue({ results: [] });

    const adapter = new ExaSearchAdapter("api-key");

    await adapter.search({ query: "typescript jobs" });

    expect(ExaMock).toHaveBeenCalledWith("api-key");
    expect(searchMock).toHaveBeenCalledWith("typescript jobs", {
      contents: {
        highlights: {
          maxCharacters: 4_000
        }
      },
      numResults: 3,
      type: "deep"
    });
  });

  it("respects explicit overrides passed to search", async () => {
    searchMock.mockResolvedValue({ results: [] });

    const adapter = new ExaSearchAdapter("api-key");

    await adapter.search({
      maxCharacters: 1_200,
      numResults: 8,
      query: "remote software engineer",
      type: "deep-lite"
    });

    expect(searchMock).toHaveBeenCalledWith("remote software engineer", {
      contents: {
        highlights: {
          maxCharacters: 1_200
        }
      },
      numResults: 8,
      type: "deep-lite"
    });
  });

  it("normalizes raw results into discovery candidates", () => {
    const adapter = new ExaSearchAdapter("api-key");

    expect(
      adapter.normalizeResults([
        {
          highlights: ["Build TypeScript services"],
          publishedDate: "2026-04-22",
          title: "Software Engineer - ACME",
          url: "https://jobs.acme.com/acme/software-engineer"
        },
        {
          publishedDate: "2026-04-21",
          title: null,
          url: "https://jobs.acme.com/acme/backend-engineer"
        }
      ])
    ).toEqual([
      {
        highlightPreview: "Build TypeScript services",
        publishedDate: "2026-04-22",
        title: "Software Engineer - ACME",
        url: "https://jobs.acme.com/acme/software-engineer"
      },
      {
        highlightPreview: undefined,
        publishedDate: "2026-04-21",
        title: undefined,
        url: "https://jobs.acme.com/acme/backend-engineer"
      }
    ]);
  });

  it("returns an empty list when no results are returned", () => {
    const adapter = new ExaSearchAdapter("api-key");

    expect(adapter.normalizeResults([])).toEqual([]);
  });
});
