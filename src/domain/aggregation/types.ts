import type { DiscoveryCandidate } from "../discovery-candidate";
import type { CandidateFilter, CandidateEvaluation } from "../filters/types";
import type { DiscoveryCompanyCandidate } from "../../contract/discovery-company-candidate";

export type { DiscoveryCompanyCandidate } from "../../contract/discovery-company-candidate";

export type AcceptedCandidatesStageResult = {
  accepted: DiscoveryCandidate[];
  excluded: CandidateEvaluation[];
};

export type AggregationPipelineResult = {
  accepted: DiscoveryCandidate[];
  excluded: CandidateEvaluation[];
  companyCandidates: DiscoveryCompanyCandidate[];
};

export type StageInput = {
  candidates: DiscoveryCandidate[];
  filters: CandidateFilter[];
};
