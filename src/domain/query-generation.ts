import type { DiscoveryProfile } from "../config/discovery-profile";
import type { ExaSearchInput } from "../sources/search/exa";

export type GeneratedQuery = {
  query: string;
};

export type ExaTuningDefaults = {
  maxCharacters: number;
  numResults: number;
  type: ExaSearchInput["type"];
};

export const DEFAULT_EXA_TUNING: ExaTuningDefaults = {
  maxCharacters: 1_500,
  numResults: 3,
  type: "deep"
};

export const generateDiscoveryQuery = (
  profile: DiscoveryProfile
): GeneratedQuery => {
  if (profile.roleKeywords.length === 0) {
    throw new Error(
      "Cannot generate discovery query: roleKeywords must contain at least one value"
    );
  }

  const clauses: string[] = [];

  clauses.push(profile.roleKeywords.join(" "));

  if (profile.locationConstraints.length > 0) {
    clauses.push(profile.locationConstraints.join(" "));
  }

  if (profile.endToEndOwnership) {
    clauses.push("end to end ownership");
  }

  if (profile.preferredTechStack.length > 0) {
    clauses.push(profile.preferredTechStack.join(" "));
  }

  if (profile.companyPreferences.length > 0) {
    clauses.push(`company:${profile.companyPreferences.join(" OR company:")}`);
  }

  if (profile.productSurfacePreferences.length > 0) {
    const siteClauses = profile.productSurfacePreferences.map(
      (surface) => `site:${surface.replace(/\s+/g, ".")}`
    );
    clauses.push(siteClauses.join(" OR "));
  }

  if (profile.excludedRoleKeywords.length > 0) {
    const exclusionClauses = profile.excludedRoleKeywords.map(
      (keyword) => `-${keyword}`
    );
    clauses.push(exclusionClauses.join(" "));
  }

  return { query: clauses.join(" ") };
};

export const resolveExaSearchInput = (params: {
  explicitQueryOverride?: string;
  generatedQuery: string;
  tuningOverrides?: Partial<ExaSearchInput>;
  tuningDefaults?: ExaTuningDefaults;
}): ExaSearchInput => {
  const {
    explicitQueryOverride,
    generatedQuery,
    tuningOverrides = {},
    tuningDefaults = DEFAULT_EXA_TUNING
  } = params;

  const query = explicitQueryOverride ?? generatedQuery;

  return {
    query,
    maxCharacters: tuningOverrides.maxCharacters ?? tuningDefaults.maxCharacters,
    numResults: tuningOverrides.numResults ?? tuningDefaults.numResults,
    type: tuningOverrides.type ?? tuningDefaults.type
  };
};
