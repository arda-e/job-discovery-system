import type { DiscoveryCandidate } from "../discovery-candidate";
import type { CandidateFilter } from "../filters/types";
import type { AggregationPipelineResult } from "./types";
import { runAcceptedCandidatesStage as acceptedCandidatesStage } from "./accepted-candidates-stage";
import { companyGroupingStage } from "./company-grouping-stage";

export const runAggregationPipeline = (
  candidates: DiscoveryCandidate[],
  filters: CandidateFilter[]
): AggregationPipelineResult => {
  const { accepted, excluded } = acceptedCandidatesStage(candidates, filters);
  const grouped = companyGroupingStage(accepted);

  return {
    accepted,
    excluded,
    grouped
  };
};
