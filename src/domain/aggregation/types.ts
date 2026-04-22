import type { DiscoveryCandidate } from "../discovery-candidate";
import type { CandidateFilter, CandidateEvaluation } from "../filters/types";

export type { GroupedCompanyCandidate } from "../company-grouper";

export type AcceptedCandidatesStageResult = {
  accepted: DiscoveryCandidate[];
  excluded: CandidateEvaluation[];
};

export type AggregationPipelineResult = {
  accepted: DiscoveryCandidate[];
  excluded: CandidateEvaluation[];
  grouped: import("../company-grouper").GroupedCompanyCandidate[];
};

export type StageInput = {
  candidates: DiscoveryCandidate[];
  filters: CandidateFilter[];
};
