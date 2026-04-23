import type { DiscoveryCompanyCandidate } from "../contract/discovery-company-candidate";
import type { DiscoveryCandidate } from "./discovery-candidate";
import { deriveCompanyIdentity } from "./company-identity";

const ATS_HOST_PATTERNS = [
  /jobs\.lever\.co$/i,
  /boards\.greenhouse\.io$/i,
  /jobs\.ashbyhq\.com$/i
];

const classifySourceType = (url: string): "ats" | "company-careers" => {
  try {
    const parsed = new URL(url);

    if (ATS_HOST_PATTERNS.some((pattern) => pattern.test(parsed.hostname))) {
      return "ats";
    }
  } catch {
    return "company-careers";
  }

  return "company-careers";
};

const classifyEntryKind = (
  sourceType: "ats" | "company-careers"
): "scan-target" | "lead" =>
  sourceType === "ats" ? "scan-target" : "lead";

export const normalizeToCompanyCandidates = (
  candidates: DiscoveryCandidate[]
): DiscoveryCompanyCandidate[] => {
  const groups = new Map<
    string,
    {
      companySlug: string;
      companyName: string;
      portalUrl: string;
      sourceType: "ats" | "company-careers";
      entryKind: "scan-target" | "lead";
      matchedTitlesSet: Set<string>;
      sourceUrlsSet: Set<string>;
      evidenceCount: number;
      highlightPreview?: string;
    }
  >();

  for (const candidate of candidates) {
    const companyIdentity = deriveCompanyIdentity(candidate);

    if (!companyIdentity) {
      continue;
    }

    const { companyName, companySlug } = companyIdentity;
    const sourceType = classifySourceType(candidate.url);
    const entryKind = classifyEntryKind(sourceType);
    const existingGroup = groups.get(companySlug);

    if (existingGroup) {
      existingGroup.evidenceCount += 1;
      existingGroup.sourceUrlsSet.add(candidate.url);

      if (candidate.title) {
        existingGroup.matchedTitlesSet.add(candidate.title);
      }

      if (!existingGroup.highlightPreview && candidate.highlightPreview) {
        existingGroup.highlightPreview = candidate.highlightPreview;
      }

      continue;
    }

    groups.set(companySlug, {
      companySlug,
      companyName,
      portalUrl: candidate.url,
      sourceType,
      entryKind,
      matchedTitlesSet: candidate.title ? new Set([candidate.title]) : new Set(),
      sourceUrlsSet: new Set([candidate.url]),
      evidenceCount: 1,
      highlightPreview: candidate.highlightPreview
    });
  }

  return Array.from(groups.values()).map((group) => ({
    companySlug: group.companySlug,
    companyName: group.companyName,
    portalUrl: group.portalUrl,
    sourceType: group.sourceType,
    entryKind: group.entryKind,
    matchedTitles: Array.from(group.matchedTitlesSet),
    sourceUrls: Array.from(group.sourceUrlsSet),
    evidenceCount: group.evidenceCount,
    highlightPreview: group.highlightPreview
  }));
};
