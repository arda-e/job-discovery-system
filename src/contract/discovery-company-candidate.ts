export type DiscoveryCompanyCandidate = {
  companySlug: string;
  companyName: string;
  portalUrl: string;
  sourceType: "ats" | "company-careers";
  entryKind: "scan-target" | "lead";
  matchedTitles: string[];
  sourceUrls: string[];
  evidenceCount: number;
  highlightPreview?: string;
};
