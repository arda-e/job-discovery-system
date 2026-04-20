import type { DiscoveryCandidate } from "../discovery-candidate";

export type IncludeDecision = {
  kind: "include";
};

export type ExcludeDecision = {
  kind: "exclude";
  reason: string;
};

export type FilterDecision = IncludeDecision | ExcludeDecision;

export type CandidateFilter = {
  evaluate: (candidate: DiscoveryCandidate) => FilterDecision;
  name: string;
};

export type CandidateEvaluation = {
  accepted: boolean;
  candidate: DiscoveryCandidate;
  excludedBy?: string;
  reason?: string;
};
