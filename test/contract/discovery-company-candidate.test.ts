import type { DiscoveryCompanyCandidate } from "../../src/contract/discovery-company-candidate";

describe("DiscoveryCompanyCandidate", () => {
  it("accepts a fully populated ATS scan-target candidate", () => {
    const candidate: DiscoveryCompanyCandidate = {
      companySlug: "acme",
      companyName: "Acme",
      portalUrl: "https://jobs.lever.co/acme",
      sourceType: "ats",
      entryKind: "scan-target",
      matchedTitles: ["Software Engineer", "Full Stack Engineer"],
      sourceUrls: [
        "https://jobs.lever.co/acme/software-engineer",
        "https://jobs.lever.co/acme/full-stack-engineer"
      ],
      evidenceCount: 2,
      highlightPreview: "Build TypeScript services"
    };

    expect(candidate.companySlug).toBe("acme");
    expect(candidate.companyName).toBe("Acme");
    expect(candidate.portalUrl).toBe("https://jobs.lever.co/acme");
    expect(candidate.sourceType).toBe("ats");
    expect(candidate.entryKind).toBe("scan-target");
    expect(candidate.matchedTitles).toHaveLength(2);
    expect(candidate.sourceUrls).toHaveLength(2);
    expect(candidate.evidenceCount).toBe(2);
    expect(candidate.highlightPreview).toBe("Build TypeScript services");
  });

  it("accepts a company-careers lead candidate", () => {
    const candidate: DiscoveryCompanyCandidate = {
      companySlug: "beta-corp",
      companyName: "Beta Corp",
      portalUrl: "https://beta.careers/jobs",
      sourceType: "company-careers",
      entryKind: "lead",
      matchedTitles: ["Engineer"],
      sourceUrls: ["https://beta.careers/jobs"],
      evidenceCount: 1
    };

    expect(candidate.sourceType).toBe("company-careers");
    expect(candidate.entryKind).toBe("lead");
    expect(candidate.highlightPreview).toBeUndefined();
  });

  it("allows highlightPreview to be omitted without placeholder strings", () => {
    const candidate: DiscoveryCompanyCandidate = {
      companySlug: "gamma",
      companyName: "Gamma",
      portalUrl: "https://jobs.lever.co/gamma",
      sourceType: "ats",
      entryKind: "scan-target",
      matchedTitles: ["Developer"],
      sourceUrls: ["https://jobs.lever.co/gamma/developer"],
      evidenceCount: 1
    };

    expect("highlightPreview" in candidate).toBe(false);
  });

  it("preserves evidenceCount separately from deduplicated arrays", () => {
    const candidate: DiscoveryCompanyCandidate = {
      companySlug: "delta",
      companyName: "Delta",
      portalUrl: "https://jobs.lever.co/delta",
      sourceType: "ats",
      entryKind: "scan-target",
      matchedTitles: ["Engineer"],
      sourceUrls: ["https://jobs.lever.co/delta/engineer"],
      evidenceCount: 5
    };

    expect(candidate.evidenceCount).toBe(5);
    expect(candidate.matchedTitles).toHaveLength(1);
    expect(candidate.sourceUrls).toHaveLength(1);
  });
});
