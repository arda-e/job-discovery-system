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

  it("returns accepted, grouped, and excluded results for mixed candidates", () => {
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
          excludedBy: "title-filter",
          reason: "senior roles excluded",
          title: "Senior Software Engineer - ACME",
          url: "https://jobs.acme.com/acme/senior-software-engineer"
        }
      ],
      grouped: [
        {
          companyName: "Acme",
          companySlug: "acme",
          evidenceCount: 2,
          sampleTitles: [
            "Software Engineer - ACME",
            "Full Stack Engineer - ACME"
          ],
          sourceUrls: [
            "https://jobs.acme.com/acme/software-engineer",
            "https://jobs.acme.com/acme/full-stack-engineer"
          ]
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

    expect(result.grouped).toEqual([
      {
        companyName: "Acme",
        companySlug: "acme",
        evidenceCount: 1,
        sampleTitles: ["Software Engineer - ACME"],
        sourceUrls: ["https://jobs.acme.com/acme/software-engineer"]
      },
      {
        companyName: "Beta",
        companySlug: "beta",
        evidenceCount: 1,
        sampleTitles: ["Software Engineer - Beta"],
        sourceUrls: ["https://jobs.beta.com/beta/software-engineer"]
      }
    ]);
  });

  it("returns empty outputs for an empty candidate list", () => {
    expect(runAggregationPipeline([], [includeAllFilter])).toEqual({
      accepted: [],
      excluded: [],
      grouped: []
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
    expect(result.grouped).toHaveLength(1);
  });

  it("returns empty accepted and grouped arrays when all candidates are rejected", () => {
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
          excludedBy: "exclude-all",
          reason: "all roles excluded",
          title: "Software Engineer - ACME",
          url: "https://jobs.acme.com/acme/software-engineer"
        }
      ],
      grouped: []
    });
  });
});
