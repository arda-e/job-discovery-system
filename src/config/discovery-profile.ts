export type DiscoveryProfile = {
  roleKeywords: string[];
  excludedRoleKeywords: string[];
  locationConstraints: string[];
  companyPreferences: string[];
  productSurfacePreferences: string[];
  endToEndOwnership: boolean;
  preferredTechStack: string[];
};

type RawProfileInput = {
  roleKeywords?: string;
  excludedRoleKeywords?: string;
  locationConstraints?: string;
  companyPreferences?: string;
  productSurfacePreferences?: string;
  endToEndOwnership?: string;
  preferredTechStack?: string;
};

const parseCommaDelimited = (value: string | undefined): string[] => {
  if (!value || value.trim().length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  value.split(",").forEach((raw) => {
    const trimmed = raw.trim();
    if (trimmed.length > 0 && !seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
  });

  return result;
};

const parseBoolean = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }
  return value.trim().toLowerCase() === "true";
};

export const parseDiscoveryProfile = (
  input: RawProfileInput = {}
): DiscoveryProfile => {
  const roleKeywords = parseCommaDelimited(input.roleKeywords);

  if (roleKeywords.length === 0) {
    throw new Error(
      "Invalid discovery profile: roleKeywords is required and must contain at least one value"
    );
  }

  return {
    roleKeywords,
    excludedRoleKeywords: parseCommaDelimited(input.excludedRoleKeywords),
    locationConstraints: parseCommaDelimited(input.locationConstraints),
    companyPreferences: parseCommaDelimited(input.companyPreferences),
    productSurfacePreferences: parseCommaDelimited(
      input.productSurfacePreferences
    ),
    endToEndOwnership: parseBoolean(input.endToEndOwnership),
    preferredTechStack: parseCommaDelimited(input.preferredTechStack)
  };
};

export const loadDiscoveryProfile = (
  env: Record<string, string | undefined> = process.env
): DiscoveryProfile =>
  parseDiscoveryProfile({
    roleKeywords: env.DISCOVERY_ROLE_KEYWORDS,
    excludedRoleKeywords: env.DISCOVERY_EXCLUDED_ROLE_KEYWORDS,
    locationConstraints: env.DISCOVERY_LOCATION_CONSTRAINTS,
    companyPreferences: env.DISCOVERY_COMPANY_PREFERENCES,
    productSurfacePreferences: env.DISCOVERY_PRODUCT_SURFACE_PREFERENCES,
    endToEndOwnership: env.DISCOVERY_END_TO_END_OWNERSHIP,
    preferredTechStack: env.DISCOVERY_PREFERRED_TECH_STACK
  });
