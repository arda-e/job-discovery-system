import { normalizeToCompanyCandidates } from "../../src/domain/company-grouper";

describe("normalizeToCompanyCandidates", () => {
  it("collapses duplicate candidates from the same company into one group", () => {
    const result = normalizeToCompanyCandidates([
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

    expect(result).toEqual([
      {
        companySlug: "acme",
        companyName: "Acme",
        portalUrl: "https://jobs.acme.com/acme/software-engineer",
        sourceType: "company-careers",
        entryKind: "lead",
        matchedTitles: ["Software Engineer - ACME", "Full Stack Engineer - ACME"],
        sourceUrls: [
          "https://jobs.acme.com/acme/software-engineer",
          "https://jobs.acme.com/acme/full-stack-engineer",
          "https://jobs.acme.com/acme/software-engineer-2"
        ],
        evidenceCount: 3
      }
    ]);
  });

  it("keeps candidates from different companies in separate groups", () => {
    const result = normalizeToCompanyCandidates([
      {
        title: "Software Engineer - ACME",
        url: "https://jobs.acme.com/acme/software-engineer"
      },
      {
        title: "Software Engineer - Beta",
        url: "https://jobs.beta.com/beta/software-engineer"
      }
    ]);

    expect(result).toEqual([
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

  it("classifies ATS URLs correctly", () => {
    const result = normalizeToCompanyCandidates([
      {
        title: "Engineer",
        url: "https://jobs.lever.co/acme/engineer"
      }
    ]);

    expect(result[0].sourceType).toBe("ats");
    expect(result[0].entryKind).toBe("scan-target");
  });

  it("does not duplicate sourceUrls for repeated URLs", () => {
    const result = normalizeToCompanyCandidates([
      {
        title: "Engineer",
        url: "https://jobs.lever.co/acme/engineer"
      },
      {
        title: "Engineer",
        url: "https://jobs.lever.co/acme/engineer"
      }
    ]);

    expect(result[0].sourceUrls).toHaveLength(1);
    expect(result[0].evidenceCount).toBe(2);
  });

  it("does not duplicate matchedTitles for repeated titles", () => {
    const result = normalizeToCompanyCandidates([
      {
        title: "Engineer",
        url: "https://jobs.lever.co/acme/engineer-1"
      },
      {
        title: "Engineer",
        url: "https://jobs.lever.co/acme/engineer-2"
      }
    ]);

    expect(result[0].matchedTitles).toHaveLength(1);
    expect(result[0].evidenceCount).toBe(2);
  });

  it("skips candidates that cannot derive a company identity", () => {
    expect(
      normalizeToCompanyCandidates([
        {
          url: "not-a-url"
        }
      ])
    ).toEqual([]);
  });

  it("returns an empty array for no candidates", () => {
    expect(normalizeToCompanyCandidates([])).toEqual([]);
  });
});
