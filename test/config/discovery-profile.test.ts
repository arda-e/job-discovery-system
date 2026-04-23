import { loadDiscoveryProfile, parseDiscoveryProfile } from "../../src/config/discovery-profile";

describe("parseDiscoveryProfile", () => {
  it("parses a complete profile with trimmed, deduplicated arrays", () => {
    const profile = parseDiscoveryProfile({
      roleKeywords: "software engineer, full stack,  typescript ",
      excludedRoleKeywords: "senior, staff, principal",
      locationConstraints: "remote, united states",
      companyPreferences: "stripe, shopify",
      productSurfacePreferences: "company careers, github",
      endToEndOwnership: "true",
      preferredTechStack: "typescript, node.js"
    });

    expect(profile.roleKeywords).toEqual([
      "software engineer",
      "full stack",
      "typescript"
    ]);
    expect(profile.excludedRoleKeywords).toEqual(["senior", "staff", "principal"]);
    expect(profile.locationConstraints).toEqual(["remote", "united states"]);
    expect(profile.companyPreferences).toEqual(["stripe", "shopify"]);
    expect(profile.productSurfacePreferences).toEqual([
      "company careers",
      "github"
    ]);
    expect(profile.endToEndOwnership).toBe(true);
    expect(profile.preferredTechStack).toEqual(["typescript", "node.js"]);
  });

  it("yields empty arrays for missing optional fields", () => {
    const profile = parseDiscoveryProfile({
      roleKeywords: "engineer"
    });

    expect(profile.roleKeywords).toEqual(["engineer"]);
    expect(profile.excludedRoleKeywords).toEqual([]);
    expect(profile.locationConstraints).toEqual([]);
    expect(profile.companyPreferences).toEqual([]);
    expect(profile.productSurfacePreferences).toEqual([]);
    expect(profile.endToEndOwnership).toBe(false);
    expect(profile.preferredTechStack).toEqual([]);
  });

  it("normalizes extra commas and whitespace without reordering", () => {
    const profile = parseDiscoveryProfile({
      roleKeywords: "  engineer , , fullstack , , typescript  , "
    });

    expect(profile.roleKeywords).toEqual(["engineer", "fullstack", "typescript"]);
  });

  it("deduplicates values while preserving first-seen order", () => {
    const profile = parseDiscoveryProfile({
      roleKeywords: "engineer, engineer, fullstack, engineer, typescript, fullstack"
    });

    expect(profile.roleKeywords).toEqual(["engineer", "fullstack", "typescript"]);
  });

  it("fails when roleKeywords is missing", () => {
    expect(() => parseDiscoveryProfile({})).toThrow(
      "Invalid discovery profile: roleKeywords is required and must contain at least one value"
    );
  });

  it("fails when roleKeywords is blank or whitespace-only", () => {
    expect(() => parseDiscoveryProfile({ roleKeywords: "   " })).toThrow(
      "Invalid discovery profile: roleKeywords is required and must contain at least one value"
    );
  });

  it("does not produce blank entries from comma-delimited input", () => {
    const profile = parseDiscoveryProfile({
      roleKeywords: "engineer,  , fullstack, , typescript"
    });

    expect(profile.roleKeywords).toEqual(["engineer", "fullstack", "typescript"]);
    expect(profile.roleKeywords).not.toContain("");
  });
});

describe("loadDiscoveryProfile", () => {
  it("loads profile from environment variables", () => {
    const profile = loadDiscoveryProfile({
      DISCOVERY_ROLE_KEYWORDS: "software engineer, full stack",
      DISCOVERY_EXCLUDED_ROLE_KEYWORDS: "senior, staff",
      DISCOVERY_LOCATION_CONSTRAINTS: "remote",
      DISCOVERY_COMPANY_PREFERENCES: "stripe",
      DISCOVERY_PRODUCT_SURFACE_PREFERENCE: "company careers",
      DISCOVERY_END_TO_END_OWNERSHIP: "true",
      DISCOVERY_PREFERRED_TECH_STACK: "typescript, node.js"
    });

    expect(profile.roleKeywords).toEqual(["software engineer", "full stack"]);
    expect(profile.excludedRoleKeywords).toEqual(["senior", "staff"]);
    expect(profile.locationConstraints).toEqual(["remote"]);
    expect(profile.companyPreferences).toEqual(["stripe"]);
    expect(profile.endToEndOwnership).toBe(true);
    expect(profile.preferredTechStack).toEqual(["typescript", "node.js"]);
  });

  it("fails when DISCOVERY_ROLE_KEYWORDS is missing from env", () => {
    expect(() => loadDiscoveryProfile({})).toThrow(
      "Invalid discovery profile: roleKeywords is required and must contain at least one value"
    );
  });
});
