import type { DiscoveryCandidate } from "./discovery-candidate";

export type CompanyIdentity = {
  companyName: string;
  companySlug: string;
};

const ATS_HOST_PATTERNS: Array<{ hostPattern: RegExp; segmentIndex: number }> = [
  { hostPattern: /jobs\.lever\.co$/i, segmentIndex: 0 },
  { hostPattern: /boards\.greenhouse\.io$/i, segmentIndex: 0 },
  { hostPattern: /jobs\.ashbyhq\.com$/i, segmentIndex: 0 }
];

const slugToCompanyName = (slug: string): string =>
  slug
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const sanitizeToSlug = (raw: string): string =>
  raw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const titleToSlug = (title: string | undefined): string | undefined => {
  const prefix = title?.split(" - ")[0]?.trim();

  if (!prefix) {
    return undefined;
  }

  const sanitized = sanitizeToSlug(prefix);
  return sanitized || undefined;
};

const extractCompanyFromUrl = (url: URL): string | undefined => {
  for (const { hostPattern, segmentIndex } of ATS_HOST_PATTERNS) {
    if (hostPattern.test(url.hostname)) {
      const pathSegments = url.pathname.split("/").filter(Boolean);
      const segment = pathSegments[segmentIndex];

      if (segment) {
        return segment.toLowerCase();
      }
    }
  }

  return undefined;
};

export const deriveCompanySlug = (
  candidate: DiscoveryCandidate
): string | undefined => {
  try {
    const url = new URL(candidate.url);
    const atsCompanySlug = extractCompanyFromUrl(url);

    if (atsCompanySlug) {
      return atsCompanySlug;
    }

    const pathSegments = url.pathname.split("/").filter(Boolean);
    const firstSegment = pathSegments[0];

    if (firstSegment) {
      return firstSegment.toLowerCase();
    }

    return titleToSlug(candidate.title);
  } catch {
    return titleToSlug(candidate.title);
  }
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
