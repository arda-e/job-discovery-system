import type { DiscoveryCandidate } from "./discovery-candidate";

export type CompanyIdentity = {
  companyName: string;
  companySlug: string;
};

const slugToCompanyName = (slug: string): string =>
  slug
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const titlePrefixToSlug = (title: string | undefined): string | undefined => {
  const prefix = title?.split(" - ")[0]?.trim().toLowerCase();

  if (!prefix) {
    return undefined;
  }

  return prefix.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
};

export const deriveCompanySlug = (
  candidate: DiscoveryCandidate
): string | undefined => {
  try {
    const url = new URL(candidate.url);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const firstSegment = pathSegments[0];

    if (firstSegment) {
      return firstSegment.toLowerCase();
    }
  } catch {
    return titlePrefixToSlug(candidate.title);
  }

  return titlePrefixToSlug(candidate.title);
};

export const deriveCompanyIdentity = (
  candidate: DiscoveryCandidate
): CompanyIdentity | undefined => {
  const companySlug = deriveCompanySlug(candidate);

  if (!companySlug) {
    return undefined;
  }

  return {
    companyName: slugToCompanyName(companySlug),
    companySlug
  };
};
