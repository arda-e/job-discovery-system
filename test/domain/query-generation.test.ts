import {
  DEFAULT_EXA_TUNING,
  generateDiscoveryQuery,
  resolveExaSearchInput
} from "../../src/domain/query-generation";
import type { DiscoveryProfile } from "../../src/config/discovery-profile";

describe("generateDiscoveryQuery", () => {
  const baseProfile: DiscoveryProfile = {
    roleKeywords: ["software engineer"],
    excludedRoleKeywords: [],
    locationConstraints: [],
    companyPreferences: [],
    productSurfacePreferences: [],
    endToEndOwnership: false,
    preferredTechStack: []
  };

  it("produces a query with role, location, ownership, and stack signals", () => {
    const profile: DiscoveryProfile = {
      roleKeywords: ["software engineer", "full stack"],
      excludedRoleKeywords: ["senior", "staff"],
      locationConstraints: ["remote"],
      companyPreferences: [],
      productSurfacePreferences: [],
      endToEndOwnership: true,
      preferredTechStack: ["typescript", "node.js"]
    };

    const result = generateDiscoveryQuery(profile);

    expect(result.query).toBe(
      "software engineer full stack remote end to end ownership typescript node.js -senior -staff"
    );
  });

  it("enriches query with company-preference and product-surface hints", () => {
    const profile: DiscoveryProfile = {
      roleKeywords: ["engineer"],
      excludedRoleKeywords: [],
      locationConstraints: ["remote"],
      companyPreferences: ["stripe", "shopify"],
      productSurfacePreferences: ["jobs.lever.co", "jobs.greenhouse.io"],
      endToEndOwnership: false,
      preferredTechStack: []
    };

    const result = generateDiscoveryQuery(profile);

    expect(result.query).toBe(
      "engineer remote company:stripe OR company:shopify site:jobs.lever.co OR site:jobs.greenhouse.io"
    );
  });

  it("omits optional sections without generating malformed spacing", () => {
    const result = generateDiscoveryQuery(baseProfile);

    expect(result.query).toBe("software engineer");
    expect(result.query).not.toMatch(/\s{2,}/);
    expect(result.query).not.toMatch(/^\s|\s$/);
  });

  it("produces identical query text for repeated calls", () => {
    const profile: DiscoveryProfile = {
      roleKeywords: ["engineer"],
      excludedRoleKeywords: ["senior"],
      locationConstraints: ["remote"],
      companyPreferences: ["stripe"],
      productSurfacePreferences: ["jobs.lever.co"],
      endToEndOwnership: true,
      preferredTechStack: ["typescript"]
    };

    const first = generateDiscoveryQuery(profile);
    const second = generateDiscoveryQuery(profile);

    expect(first.query).toBe(second.query);
  });

  it("fails when roleKeywords is empty", () => {
    const profile: DiscoveryProfile = {
      roleKeywords: [],
      excludedRoleKeywords: [],
      locationConstraints: [],
      companyPreferences: [],
      productSurfacePreferences: [],
      endToEndOwnership: false,
      preferredTechStack: []
    };

    expect(() => generateDiscoveryQuery(profile)).toThrow(
      "Cannot generate discovery query: roleKeywords must contain at least one value"
    );
  });
});

describe("resolveExaSearchInput", () => {
  it("uses generated query when no override is provided", () => {
    const result = resolveExaSearchInput({
      generatedQuery: "engineer remote typescript"
    });

    expect(result.query).toBe("engineer remote typescript");
    expect(result.maxCharacters).toBe(1_500);
    expect(result.numResults).toBe(3);
    expect(result.type).toBe("deep");
  });

  it("uses explicit query override when provided", () => {
    const result = resolveExaSearchInput({
      explicitQueryOverride: "site:jobs.lever.co data engineer",
      generatedQuery: "engineer remote typescript"
    });

    expect(result.query).toBe("site:jobs.lever.co data engineer");
  });

  it("applies partial tuning overrides without discarding defaults", () => {
    const result = resolveExaSearchInput({
      generatedQuery: "engineer remote",
      tuningOverrides: { numResults: 5 }
    });

    expect(result.query).toBe("engineer remote");
    expect(result.numResults).toBe(5);
    expect(result.maxCharacters).toBe(1_500);
    expect(result.type).toBe("deep");
  });

  it("applies custom tuning defaults when provided", () => {
    const result = resolveExaSearchInput({
      generatedQuery: "engineer",
      tuningDefaults: {
        maxCharacters: 2_000,
        numResults: 10,
        type: "fast"
      }
    });

    expect(result.maxCharacters).toBe(2_000);
    expect(result.numResults).toBe(10);
    expect(result.type).toBe("fast");
  });

  it("tuning overrides take precedence over custom defaults", () => {
    const result = resolveExaSearchInput({
      generatedQuery: "engineer",
      tuningOverrides: { numResults: 1, type: "instant" },
      tuningDefaults: {
        maxCharacters: 2_000,
        numResults: 10,
        type: "fast"
      }
    });

    expect(result.numResults).toBe(1);
    expect(result.type).toBe("instant");
    expect(result.maxCharacters).toBe(2_000);
  });
});
