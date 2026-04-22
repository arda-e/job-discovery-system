import type { DiscoveryCandidate } from "./discovery-candidate";
import { deriveCompanyIdentity } from "./company-identity";

export type GroupedCompanyCandidate = {
  companyName: string;
  companySlug: string;
  evidenceCount: number;
  sampleTitles: string[];
  sourceUrls: string[];
};

/**
 * Groups accepted discovery candidates by derived company identity.
 */
export const groupCandidatesByCompany = (
  candidates: DiscoveryCandidate[]
): GroupedCompanyCandidate[] => {
  const groups = new Map<string, GroupedCompanyCandidate>();

  for (const candidate of candidates) {
    const companyIdentity = deriveCompanyIdentity(candidate);

    if (!companyIdentity) {
      continue;
    }

    const { companyName, companySlug } = companyIdentity;
    const existingGroup = groups.get(companySlug);

    if (existingGroup) {
      existingGroup.evidenceCount += 1;
      existingGroup.sourceUrls.push(candidate.url);

      if (candidate.title && !existingGroup.sampleTitles.includes(candidate.title)) {
        existingGroup.sampleTitles.push(candidate.title);
      }

      continue;
    }

    groups.set(companySlug, {
      companyName,
      companySlug,
      evidenceCount: 1,
      sampleTitles: candidate.title ? [candidate.title] : [],
      sourceUrls: [candidate.url]
    });
  }

  return Array.from(groups.values());
};
