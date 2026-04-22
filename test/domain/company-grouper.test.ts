import { groupCandidatesByCompany } from "../../src/domain/company-grouper";

describe("groupCandidatesByCompany", () => {
  it("collapses duplicate candidates from the same company into one group", () => {
    const grouped = groupCandidatesByCompany([
      {
        title: "Software Engineer - ACME",
        url: "https://jobs.acme.com/acme/software-engineer"
      },
      {
        title: "Full Stack Engineer - ACME",
        url: "https://jobs.acme.com/acme/full-stack-engineer"
      },
      {
        title: "Software Engineer - ACME",
        url: "https://jobs.acme.com/acme/software-engineer-2"
      }
    ]);

    expect(grouped).toEqual([
      {
        companyName: "Acme",
        companySlug: "acme",
        evidenceCount: 3,
        sampleTitles: ["Software Engineer - ACME", "Full Stack Engineer - ACME"],
        sourceUrls: [
          "https://jobs.acme.com/acme/software-engineer",
          "https://jobs.acme.com/acme/full-stack-engineer",
          "https://jobs.acme.com/acme/software-engineer-2"
        ]
      }
    ]);
  });

  it("keeps candidates from different companies in separate groups", () => {
    expect(
      groupCandidatesByCompany([
        {
          title: "Software Engineer - ACME",
          url: "https://jobs.acme.com/acme/software-engineer"
        },
        {
          title: "Software Engineer - Beta",
          url: "https://jobs.beta.com/beta/software-engineer"
        }
      ])
    ).toEqual([
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

  it("skips candidates that cannot derive a company identity", () => {
    expect(
      groupCandidatesByCompany([
        {
          url: "not-a-url"
        }
      ])
    ).toEqual([]);
  });

  it("returns an empty array for no candidates", () => {
    expect(groupCandidatesByCompany([])).toEqual([]);
  });
});
