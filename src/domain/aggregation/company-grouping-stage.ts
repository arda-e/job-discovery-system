import { groupCandidatesByCompany } from "../company-grouper";
import type { DiscoveryCandidate } from "../discovery-candidate";
import type { GroupedCompanyCandidate } from "../company-grouper";

/**
 * Stage that groups candidates by company.
 * Wraps the existing groupCandidatesByCompany function to provide a stage interface.
 */
export const companyGroupingStage = (
  candidates: DiscoveryCandidate[]
): GroupedCompanyCandidate[] => {
  return groupCandidatesByCompany(candidates);
};