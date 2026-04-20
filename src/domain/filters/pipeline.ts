import type { DiscoveryCandidate } from "../discovery-candidate";
import type {
  CandidateEvaluation,
  CandidateFilter
} from "./types";

/**
 * Evaluates one candidate against the configured filter chain.
 */
export const evaluateCandidate = (
  candidate: DiscoveryCandidate,
  filters: CandidateFilter[]
): CandidateEvaluation => {
  for (const filter of filters) {
    const decision = filter.evaluate(candidate);

    if (decision.kind === "exclude") {
      return {
        accepted: false,
        candidate,
        excludedBy: filter.name,
        reason: decision.reason
      };
    }
  }

  return {
    accepted: true,
    candidate
  };
};

/**
 * Evaluates a list of candidates against the configured filter chain.
 */
export const evaluateCandidates = (
  candidates: DiscoveryCandidate[],
  filters: CandidateFilter[]
): CandidateEvaluation[] =>
  candidates.map((candidate) => evaluateCandidate(candidate, filters));
