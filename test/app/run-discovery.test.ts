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
      "site:jobs.lever.co software engineer remote typescript",
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
        query: "site:jobs.lever.co software engineer remote typescript",
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
        groupedCompanyCount: 1,
        groupedCompanies: [
          {
            companyName: "Acme",
            companySlug: "acme",
            evidenceCount: 2,
            sampleTitles: [
              "Software Engineer - ACME",
              "Full Stack Engineer - ACME"
            ],
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
});
