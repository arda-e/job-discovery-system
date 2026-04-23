import type { DiscoveryCandidate } from "../../../src/domain/discovery-candidate";
import type { CandidateFilter } from "../../../src/domain/filters/types";
import { runAggregationPipeline } from "../../../src/domain/aggregation/pipeline";

describe("runAggregationPipeline", () => {
  const includeAllFilter: CandidateFilter = {
    evaluate: jest.fn(() => ({ kind: "include" })),
    name: "include-all"
  };

  const rejectSeniorFilter: CandidateFilter = {
    evaluate: jest.fn((candidate: DiscoveryCandidate) =>
      candidate.title?.includes("Senior")
        ? {
            kind: "exclude",
            reason: "senior roles excluded"
          }
        : { kind: "include" }
    ),
    name: "title-filter"
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns accepted, companyCandidates, and excluded results for mixed candidates", () => {
    const result = runAggregationPipeline(
      [
        {
          title: "Software Engineer - ACME",
          url: "https://jobs.acme.com/acme/software-engineer"
        },
        {
          title: "Full Stack Engineer - ACME",
          url: "https://jobs.acme.com/acme/full-stack-engineer"
        },
        {
          title: "Senior Software Engineer - ACME",
          url: "https://jobs.acme.com/acme/senior-software-engineer"
        }
      ],
      [rejectSeniorFilter]
    );

    expect(result).toEqual({
      accepted: [
        {
          title: "Software Engineer - ACME",
          url: "https://jobs.acme.com/acme/software-engineer"
        },
        {
          title: "Full Stack Engineer - ACME",
          url: "https://jobs.acme.com/acme/full-stack-engineer"
        }
      ],
      excluded: [
        {
          accepted: false,
          candidate: {
            title: "Senior Software Engineer - ACME",
            url: "https://jobs.acme.com/acme/senior-software-engineer"
          },
          excludedBy: "title-filter",
          reason: "senior roles excluded"
        }
      ],
      companyCandidates: [
        {
          companySlug: "acme",
          companyName: "Acme",
          portalUrl: "https://jobs.acme.com/acme/software-engineer",
          sourceType: "company-careers",
          entryKind: "lead",
          matchedTitles: [
            "Software Engineer - ACME",
            "Full Stack Engineer - ACME"
          ],
          sourceUrls: [
            "https://jobs.acme.com/acme/software-engineer",
            "https://jobs.acme.com/acme/full-stack-engineer"
          ],
          evidenceCount: 2
        }
      ]
    });
  });

  it("keeps accepted candidates from different companies in separate groups", () => {
    const result = runAggregationPipeline(
      [
        {
          title: "Software Engineer - ACME",
          url: "https://jobs.acme.com/acme/software-engineer"
        },
        {
          title: "Software Engineer - Beta",
          url: "https://jobs.beta.com/beta/software-engineer"
        }
      ],
      [includeAllFilter]
    );

    expect(result.companyCandidates).toEqual([
      {
        companySlug: "acme",
        companyName: "Acme",
        portalUrl: "https://jobs.acme.com/acme/software-engineer",
        sourceType: "company-careers",
        entryKind: "lead",
        matchedTitles: ["Software Engineer - ACME"],
        sourceUrls: ["https://jobs.acme.com/acme/software-engineer"],
        evidenceCount: 1
      },
      {
        companySlug: "beta",
        companyName: "Beta",
        portalUrl: "https://jobs.beta.com/beta/software-engineer",
        sourceType: "company-careers",
        entryKind: "lead",
        matchedTitles: ["Software Engineer - Beta"],
        sourceUrls: ["https://jobs.beta.com/beta/software-engineer"],
        evidenceCount: 1
      }
    ]);
  });

  it("returns empty outputs for an empty candidate list", () => {
    expect(runAggregationPipeline([], [includeAllFilter])).toEqual({
      accepted: [],
      excluded: [],
      companyCandidates: []
    });
  });

  it("returns an empty excluded array when all candidates are accepted", () => {
    const result = runAggregationPipeline(
      [
        {
          title: "Software Engineer - ACME",
          url: "https://jobs.acme.com/acme/software-engineer"
        }
      ],
      [includeAllFilter]
    );

    expect(result.excluded).toEqual([]);
    expect(result.accepted).toHaveLength(1);
    expect(result.companyCandidates).toHaveLength(1);
  });

  it("returns empty accepted and companyCandidates arrays when all candidates are rejected", () => {
    const excludeAllFilter: CandidateFilter = {
      evaluate: jest.fn(() => ({
        kind: "exclude",
        reason: "all roles excluded"
      })),
      name: "exclude-all"
    };

    const result = runAggregationPipeline(
      [
        {
          title: "Software Engineer - ACME",
          url: "https://jobs.acme.com/acme/software-engineer"
        }
      ],
      [excludeAllFilter]
    );

    expect(result).toEqual({
      accepted: [],
      excluded: [
        {
          accepted: false,
          candidate: {
            title: "Software Engineer - ACME",
            url: "https://jobs.acme.com/acme/software-engineer"
          },
          excludedBy: "exclude-all",
          reason: "all roles excluded"
        }
      ],
      companyCandidates: []
    });
  });
});
