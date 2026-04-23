import { evaluateCandidates } from "../filters/pipeline";
import type { CandidateFilter, CandidateEvaluation } from "../filters/types";
import type { DiscoveryCandidate } from "../discovery-candidate";
import type { AcceptedCandidatesStageResult } from "./types";

export const runAcceptedCandidatesStage = (
  candidates: DiscoveryCandidate[],
  filters: CandidateFilter[]
): AcceptedCandidatesStageResult => {
  const evaluations = evaluateCandidates(candidates, filters);

  const accepted: DiscoveryCandidate[] = [];
  const excluded: CandidateEvaluation[] = [];

  for (const evaluation of evaluations) {
    if (evaluation.accepted) {
      accepted.push(evaluation.candidate);
    } else {
      excluded.push(evaluation);
    }
  }

  return { accepted, excluded };
};
