import {
  deriveCompanyIdentity,
  deriveCompanySlug
} from "../../src/domain/company-identity";

describe("deriveCompanySlug", () => {
  it("derives stable slug from Lever-style URL", () => {
    const result = deriveCompanySlug({
      url: "https://jobs.lever.co/acme/software-engineer"
    });

    expect(result).toBe("acme");
  });

  it("derives stable slug from Greenhouse-style URL", () => {
    const result = deriveCompanySlug({
      url: "https://boards.greenhouse.io/beta-corp/jobs/123"
    });

    expect(result).toBe("beta-corp");
  });

  it("derives stable slug from Ashby-style URL", () => {
    const result = deriveCompanySlug({
      url: "https://jobs.ashbyhq.com/gamma-inc/job-abc"
    });

    expect(result).toBe("gamma-inc");
  });

  it("falls back to title-derived identity when URL parsing fails", () => {
    const result = deriveCompanySlug({
      title: "Acme Corp - Software Engineer",
      url: "not-a-url"
    });

    expect(result).toBe("acme-corp");
  });

  it("falls back to title when URL has no meaningful path segment", () => {
    const result = deriveCompanySlug({
      title: "Beta Industries",
      url: "https://example.com/"
    });

    expect(result).toBe("beta-industries");
  });

  it("normalizes mixed case to lowercase slug", () => {
    const result = deriveCompanySlug({
      url: "https://jobs.lever.co/AcMe/software-engineer"
    });

    expect(result).toBe("acme");
  });

  it("normalizes punctuation and whitespace in title fallback", () => {
    const result = deriveCompanySlug({
      title: "Acme & Sons, Inc. - Developer",
      url: "https://example.com/"
    });

    expect(result).toBe("acme-sons-inc");
  });

  it("returns undefined when both URL and title are insufficient", () => {
    const result = deriveCompanySlug({
      url: "https://example.com/"
    });

    expect(result).toBeUndefined();
  });

  it("returns undefined for malformed URL with no title", () => {
    const result = deriveCompanySlug({
      url: "not-a-url"
    });

    expect(result).toBeUndefined();
  });
});

describe("deriveCompanyIdentity", () => {
  it("returns identity from Lever-style URL", () => {
    const result = deriveCompanyIdentity({
      url: "https://jobs.lever.co/acme/software-engineer"
    });

    expect(result).toEqual({
      companyName: "Acme",
      companySlug: "acme"
    });
  });

  it("returns identity from title fallback", () => {
    const result = deriveCompanyIdentity({
      title: "Acme Corp - Software Engineer",
      url: "https://example.com/"
    });

    expect(result).toEqual({
      companyName: "Acme Corp",
      companySlug: "acme-corp"
    });
  });

  it("returns undefined when identity cannot be derived", () => {
    const result = deriveCompanyIdentity({
      url: "https://example.com/"
    });

    expect(result).toBeUndefined();
  });

  it("is deterministic for the same input", () => {
    const input = {
      url: "https://jobs.lever.co/acme/software-engineer"
    };

    expect(deriveCompanyIdentity(input)).toEqual(deriveCompanyIdentity(input));
  });
});
