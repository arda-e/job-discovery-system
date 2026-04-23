import type { DiscoveryCompanyCandidate } from "../../contract/discovery-company-candidate";
import type { DiscoveryCandidate } from "../discovery-candidate";
import { normalizeToCompanyCandidates } from "../company-grouper";
export const companyGroupingStage = (
  candidates: DiscoveryCandidate[]
): DiscoveryCompanyCandidate[] => {
  return normalizeToCompanyCandidates(candidates);
};
