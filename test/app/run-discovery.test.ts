import Exa from "exa-js";
import { DEFAULT_TITLE_KEYWORD_FILTER } from "../../src/domain/filters/title-keyword-filter";
import { runDiscovery } from "../../src/app/run-discovery";
import type { AppConfig } from "../../src/config/env";
import { secretsService } from "../../src/integrations/aws/secrets";

jest.mock("exa-js", () => jest.fn());

describe("runDiscovery", () => {
  const searchMock = jest.fn();
  const ExaMock = Exa as unknown as jest.Mock;
  const originalEnv = { ...process.env };
  let getExaApiKeySpy: jest.SpyInstance;
  const config: AppConfig = {
    appEnv: "dev",
    logLevel: "info"
  };

  const createLoggerHarness = () => {
    const entries: Array<{
      event: string;
      level: string;
      meta: Record<string, unknown>;
    }> = [];

    return {
      entries,
      logger: {
        debug: (event: string, meta: Record<string, unknown> = {}) => {
          entries.push({ event, level: "debug", meta });
        },
        error: (event: string, meta: Record<string, unknown> = {}) => {
          entries.push({ event, level: "error", meta });
        },
        info: (event: string, meta: Record<string, unknown> = {}) => {
          entries.push({ event, level: "info", meta });
        },
        warn: (event: string, meta: Record<string, unknown> = {}) => {
          entries.push({ event, level: "warn", meta });
        }
      }
    };
  };

  const restoreEnv = () => {
    process.env = { ...originalEnv };
  };

  beforeEach(() => {
    ExaMock.mockClear();
    ExaMock.mockImplementation(() => ({
      search: searchMock
    }));
    searchMock.mockReset();
    getExaApiKeySpy = jest.spyOn(secretsService, "getExaApiKey");
    process.env = { ...originalEnv };
    delete process.env.EXA_API_KEY;
    delete process.env.EXA_SECRET_ID;
    delete process.env.DISCOVERY_ROLE_KEYWORDS;
    delete process.env.DISCOVERY_EXCLUDED_ROLE_KEYWORDS;
    delete process.env.DISCOVERY_LOCATION_CONSTRAINTS;
    delete process.env.DISCOVERY_COMPANY_PREFERENCES;
    delete process.env.DISCOVERY_PRODUCT_SURFACE_PREFERENCE;
    delete process.env.DISCOVERY_END_TO_END_OWNERSHIP;
    delete process.env.DISCOVERY_PREFERRED_TECH_STACK;
  });

  afterEach(() => {
    restoreEnv();
    jest.restoreAllMocks();
  });

  it("defaults to smoke mode when no mode is provided", async () => {
    const loggerHarness = createLoggerHarness();
    const setTimeoutSpy = jest
      .spyOn(global, "setTimeout")
      .mockImplementation(((callback: (...args: unknown[]) => void) => {
        callback();
        return 0 as unknown as NodeJS.Timeout;
      }) as typeof setTimeout);

    const result = await runDiscovery({}, { config, logger: loggerHarness.logger });

    expect(result).toEqual({
      message: "ok",
      mode: "smoke"
    });
    expect(searchMock).not.toHaveBeenCalled();
    expect(getExaApiKeySpy).not.toHaveBeenCalled();
    expect(loggerHarness.entries.map((entry) => entry.event)).toEqual([
      "discovery_started",
      "smoke_path_started",
      "smoke_log",
      "smoke_log",
      "smoke_path_completed",
      "discovery_completed"
    ]);
    expect(loggerHarness.entries[0]).toMatchObject({
      event: "discovery_started",
      level: "info",
      meta: {
        config,
        mode: "smoke"
      }
    });
    expect(loggerHarness.entries[5]).toMatchObject({
      event: "discovery_completed",
      level: "info",
      meta: {
        config,
        mode: "smoke"
      }
    });

    setTimeoutSpy.mockRestore();
  });

  it("runs the discover path with a direct API key", async () => {
    process.env.EXA_API_KEY = "direct-exa-key";
    process.env.DISCOVERY_ROLE_KEYWORDS = "software engineer, typescript";
    process.env.DISCOVERY_LOCATION_CONSTRAINTS = "remote";
    searchMock.mockResolvedValue({
      results: [
        {
          highlights: ["Build TypeScript services"],
          publishedDate: "2026-04-22",
          title: "Software Engineer - ACME",
          url: "https://jobs.acme.com/acme/software-engineer"
        },
        {
          highlights: ["Build TypeScript services"],
          publishedDate: "2026-04-22",
          title: "Full Stack Engineer - ACME",
          url: "https://jobs.acme.com/acme/full-stack-engineer"
        },
        {
          highlights: ["Lead people and processes"],
          publishedDate: "2026-04-22",
          title: "Senior Software Engineer - ACME",
          url: "https://jobs.acme.com/acme/senior-software-engineer"
        }
      ]
    });
    const loggerHarness = createLoggerHarness();

    const result = await runDiscovery(
      {
        mode: "discover"
      },
      { config, logger: loggerHarness.logger }
    );

    expect(result).toEqual({
      message: "discover mode exa search completed",
      mode: "discover"
    });
    expect(getExaApiKeySpy).not.toHaveBeenCalled();
    expect(ExaMock).toHaveBeenCalledWith("direct-exa-key");
    expect(searchMock).toHaveBeenCalledWith(
      "software engineer typescript remote",
      {
        contents: {
          highlights: {
            maxCharacters: 1_500
          }
        },
        numResults: 3,
        type: "deep"
      }
    );

    expect(
      loggerHarness.entries.find(
        (entry) => entry.event === "discover_path_config_loaded"
      )
    ).toMatchObject({
      level: "info",
      meta: {
        exaConfigured: true,
        exaSecretConfigured: false
      }
    });
    expect(
      loggerHarness.entries.find(
        (entry) => entry.event === "exa_search_request_started"
      )
    ).toMatchObject({
      level: "info",
      meta: {
        maxCharacters: 1_500,
        numResults: 3,
        query: "software engineer typescript remote",
        type: "deep"
      }
    });
    expect(
      loggerHarness.entries.find(
        (entry) => entry.event === "title_keyword_filter_completed"
      )
    ).toMatchObject({
      level: "info",
      meta: {
        excludedCount: 1,
        includeKeywords: DEFAULT_TITLE_KEYWORD_FILTER.include,
        excludeKeywords: DEFAULT_TITLE_KEYWORD_FILTER.exclude,
        includedCount: 2,
        includedResults: [
          {
            highlightPreview: "Build TypeScript services",
            publishedDate: "2026-04-22",
            title: "Software Engineer - ACME",
            url: "https://jobs.acme.com/acme/software-engineer"
          },
          {
            highlightPreview: "Build TypeScript services",
            publishedDate: "2026-04-22",
            title: "Full Stack Engineer - ACME",
            url: "https://jobs.acme.com/acme/full-stack-engineer"
          }
        ],
        excludedResults: [
          {
            excludedBy: "title-keyword",
            reason: "title matched excluded keyword: senior",
            title: "Senior Software Engineer - ACME",
            url: "https://jobs.acme.com/acme/senior-software-engineer"
          }
        ]
      }
    });
    expect(
      loggerHarness.entries.find(
        (entry) => entry.event === "company_grouping_completed"
      )
    ).toMatchObject({
      level: "info",
      meta: {
        companyCandidateCount: 1,
        companyCandidates: [
          {
            companyName: "Acme",
            companySlug: "acme",
            entryKind: "lead",
            evidenceCount: 2,
            highlightPreview: "Build TypeScript services",
            matchedTitles: [
              "Software Engineer - ACME",
              "Full Stack Engineer - ACME"
            ],
            portalUrl: "https://jobs.acme.com/acme/software-engineer",
            sourceType: "company-careers",
            sourceUrls: [
              "https://jobs.acme.com/acme/software-engineer",
              "https://jobs.acme.com/acme/full-stack-engineer"
            ]
          }
        ]
      }
    });
  });

  it("uses the secret manager when EXA_SECRET_ID is provided", async () => {
    process.env.EXA_SECRET_ID = "discover-secret";
    process.env.DISCOVERY_ROLE_KEYWORDS = "engineer";
    getExaApiKeySpy.mockResolvedValue("secret-key");
    searchMock.mockResolvedValue({ results: [] });
    const loggerHarness = createLoggerHarness();

    await runDiscovery(
      {
        mode: "discover"
      },
      { config, logger: loggerHarness.logger }
    );

    expect(getExaApiKeySpy).toHaveBeenCalledWith("discover-secret");
    expect(ExaMock).toHaveBeenCalledWith("secret-key");
  });

  it("applies event overrides without mutating shared defaults", async () => {
    process.env.EXA_API_KEY = "direct-exa-key";
    process.env.DISCOVERY_ROLE_KEYWORDS = "software engineer, typescript";
    searchMock.mockResolvedValue({
      results: [
        {
          highlights: ["Build TypeScript services"],
          title: "Software Engineer - ACME",
          url: "https://jobs.acme.com/acme/software-engineer"
        }
      ]
    });
    const loggerHarness = createLoggerHarness();
    const defaultExclude = [...DEFAULT_TITLE_KEYWORD_FILTER.exclude];

    await runDiscovery(
      {
        exaSearch: {
          query: "site:jobs.greenhouse.io data engineer"
        },
        mode: "discover",
        titleFilter: {
          exclude: ["contract"]
        }
      },
      { config, logger: loggerHarness.logger }
    );

    expect(searchMock).toHaveBeenCalledWith("site:jobs.greenhouse.io data engineer", {
      contents: {
        highlights: {
          maxCharacters: 1_500
        }
      },
      numResults: 3,
      type: "deep"
    });
    expect(DEFAULT_TITLE_KEYWORD_FILTER.exclude).toEqual(defaultExclude);
    expect(
      loggerHarness.entries.find(
        (entry) => entry.event === "title_keyword_filter_completed"
      )
    ).toMatchObject({
      meta: {
        excludeKeywords: ["contract"],
        includeKeywords: DEFAULT_TITLE_KEYWORD_FILTER.include
      }
    });
  });

  it("fails fast when discover credentials are missing", async () => {
    process.env.DISCOVERY_ROLE_KEYWORDS = "engineer";
    const loggerHarness = createLoggerHarness();

    await expect(
      runDiscovery(
        {
          mode: "discover"
        },
        { config, logger: loggerHarness.logger }
      )
    ).rejects.toThrow("Missing discover credentials");

    expect(searchMock).not.toHaveBeenCalled();
    expect(getExaApiKeySpy).not.toHaveBeenCalled();
    expect(loggerHarness.entries).toEqual([]);
  });

  it("propagates secret loading failures", async () => {
    process.env.EXA_SECRET_ID = "discover-secret";
    process.env.DISCOVERY_ROLE_KEYWORDS = "engineer";
    getExaApiKeySpy.mockRejectedValue(new Error("secret lookup failed"));
    const loggerHarness = createLoggerHarness();

    await expect(
      runDiscovery(
        {
          mode: "discover"
        },
        { config, logger: loggerHarness.logger }
      )
    ).rejects.toThrow("secret lookup failed");

    expect(searchMock).not.toHaveBeenCalled();
  });

  it("generates query from env profile and calls adapter with it", async () => {
    process.env.EXA_API_KEY = "direct-exa-key";
    process.env.DISCOVERY_ROLE_KEYWORDS = "data engineer";
    process.env.DISCOVERY_LOCATION_CONSTRAINTS = "remote";
    process.env.DISCOVERY_END_TO_END_OWNERSHIP = "true";
    process.env.DISCOVERY_PREFERRED_TECH_STACK = "python";
    searchMock.mockResolvedValue({ results: [] });
    const loggerHarness = createLoggerHarness();

    await runDiscovery(
      { mode: "discover" },
      { config, logger: loggerHarness.logger }
    );

    expect(searchMock).toHaveBeenCalledWith(
      "data engineer remote end to end ownership python",
      expect.any(Object)
    );
  });

  it("validated invocation profile overrides change the generated query", async () => {
    process.env.EXA_API_KEY = "direct-exa-key";
    process.env.DISCOVERY_ROLE_KEYWORDS = "software engineer";
    process.env.DISCOVERY_LOCATION_CONSTRAINTS = "remote";
    searchMock.mockResolvedValue({ results: [] });
    const loggerHarness = createLoggerHarness();

    await runDiscovery(
      {
        mode: "discover",
        profile: {
          roleKeywords: ["data scientist"],
          locationConstraints: ["united states"]
        }
      },
      { config, logger: loggerHarness.logger }
    );

    expect(searchMock).toHaveBeenCalledWith(
      "data scientist united states",
      expect.any(Object)
    );
  });

  it("explicit query override replaces the generated query", async () => {
    process.env.EXA_API_KEY = "direct-exa-key";
    process.env.DISCOVERY_ROLE_KEYWORDS = "software engineer";
    searchMock.mockResolvedValue({ results: [] });
    const loggerHarness = createLoggerHarness();

    await runDiscovery(
      {
        exaSearch: { query: "site:jobs.lever.co machine learning engineer" },
        mode: "discover"
      },
      { config, logger: loggerHarness.logger }
    );

    expect(searchMock).toHaveBeenCalledWith(
      "site:jobs.lever.co machine learning engineer",
      expect.any(Object)
    );
  });

  it("smoke mode does not load or validate discovery profile fields", async () => {
    const loggerHarness = createLoggerHarness();
    const setTimeoutSpy = jest
      .spyOn(global, "setTimeout")
      .mockImplementation(((callback: (...args: unknown[]) => void) => {
        callback();
        return 0 as unknown as NodeJS.Timeout;
      }) as typeof setTimeout);

    const result = await runDiscovery(
      { mode: "smoke" },
      { config, logger: loggerHarness.logger }
    );

    expect(result.mode).toBe("smoke");
    expect(searchMock).not.toHaveBeenCalled();

    setTimeoutSpy.mockRestore();
  });

  it("partial Exa tuning overrides update numResults without discarding generated query", async () => {
    process.env.EXA_API_KEY = "direct-exa-key";
    process.env.DISCOVERY_ROLE_KEYWORDS = "engineer";
    searchMock.mockResolvedValue({ results: [] });
    const loggerHarness = createLoggerHarness();

    await runDiscovery(
      {
        exaSearch: { numResults: 5 },
        mode: "discover"
      },
      { config, logger: loggerHarness.logger }
    );

    expect(searchMock).toHaveBeenCalledWith(
      "engineer",
      {
        contents: { highlights: { maxCharacters: 1_500 } },
        numResults: 5,
        type: "deep"
      }
    );
  });

  it("rejects blank explicit query override", async () => {
    process.env.EXA_API_KEY = "direct-exa-key";
    process.env.DISCOVERY_ROLE_KEYWORDS = "engineer";
    const loggerHarness = createLoggerHarness();

    await expect(
      runDiscovery(
        {
          exaSearch: { query: "   " },
          mode: "discover"
        },
        { config, logger: loggerHarness.logger }
      )
    ).rejects.toThrow("explicit query override must not be blank");

    expect(searchMock).not.toHaveBeenCalled();
  });

  it("rejects malformed invocation profile override with empty roleKeywords", async () => {
    process.env.EXA_API_KEY = "direct-exa-key";
    process.env.DISCOVERY_ROLE_KEYWORDS = "engineer";
    const loggerHarness = createLoggerHarness();

    await expect(
      runDiscovery(
        {
          mode: "discover",
          profile: { roleKeywords: [] }
        },
        { config, logger: loggerHarness.logger }
      )
    ).rejects.toThrow("roleKeywords is required");

    expect(searchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid Exa tuning override with non-positive numResults", async () => {
    process.env.EXA_API_KEY = "direct-exa-key";
    process.env.DISCOVERY_ROLE_KEYWORDS = "engineer";
    const loggerHarness = createLoggerHarness();

    await expect(
      runDiscovery(
        {
          exaSearch: { numResults: 0 },
          mode: "discover"
        },
        { config, logger: loggerHarness.logger }
      )
    ).rejects.toThrow("numResults must be a positive integer");

    expect(searchMock).not.toHaveBeenCalled();
  });
});
