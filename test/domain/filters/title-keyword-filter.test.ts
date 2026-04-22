import {
  createTitleKeywordFilter,
  DEFAULT_TITLE_KEYWORD_FILTER
} from "../../../src/domain/filters/title-keyword-filter";

describe("createTitleKeywordFilter", () => {
  const candidate = (title?: string) => ({
    title,
    url: "https://jobs.example.com/acme/software-engineer"
  });

  it("uses the default include and exclude keyword lists", () => {
    expect(DEFAULT_TITLE_KEYWORD_FILTER).toEqual({
      exclude: ["senior", "staff", "principal", "lead", "manager", "director"],
      include: ["software engineer", "full stack", "fullstack", "typescript"]
    });
  });

  it("accepts titles that match an include keyword", () => {
    const filter = createTitleKeywordFilter();

    expect(filter.evaluate(candidate("Software Engineer - Platform"))).toEqual({
      kind: "include"
    });
  });

  it("rejects titles that match both include and exclude keywords", () => {
    const filter = createTitleKeywordFilter();

    expect(
      filter.evaluate(candidate("Senior Software Engineer - Platform"))
    ).toEqual({
      kind: "exclude",
      reason: "title matched excluded keyword: senior"
    });
  });

  it("rejects titles that do not match any include keyword", () => {
    const filter = createTitleKeywordFilter();

    expect(filter.evaluate(candidate("Product Manager"))).toEqual({
      kind: "exclude",
      reason: "title did not match any include keyword"
    });
  });

  it("rejects missing or empty titles", () => {
    const filter = createTitleKeywordFilter();

    expect(filter.evaluate(candidate())).toEqual({
      kind: "exclude",
      reason: "missing title"
    });

    expect(filter.evaluate(candidate(""))).toEqual({
      kind: "exclude",
      reason: "missing title"
    });
  });

  it("matches titles case-insensitively", () => {
    const filter = createTitleKeywordFilter();

    expect(filter.evaluate(candidate("FULL STACK ENGINEER"))).toEqual({
      kind: "include"
    });
  });

  it("supports custom include and exclude configuration", () => {
    const filter = createTitleKeywordFilter({
      exclude: ["contract"],
      include: ["data engineer"]
    });

    expect(filter.evaluate(candidate("Data Engineer - Contract"))).toEqual({
      kind: "exclude",
      reason: "title matched excluded keyword: contract"
    });

    expect(filter.evaluate(candidate("Data Engineer - Platform"))).toEqual({
      kind: "include"
    });
  });
});
