import type { CandidateFilter } from "./types";

export type TitleKeywordFilterConfig = {
  exclude: string[];
  include: string[];
};

export const DEFAULT_TITLE_KEYWORD_FILTER: TitleKeywordFilterConfig = {
  include: ["software engineer", "full stack", "fullstack", "typescript"],
  exclude: ["senior", "staff", "principal", "lead", "manager", "director"]
};

export const createTitleKeywordFilter = (
  config: TitleKeywordFilterConfig = DEFAULT_TITLE_KEYWORD_FILTER
): CandidateFilter => ({
  name: "title-keyword",

  evaluate(candidate) {
    const title = candidate.title?.toLowerCase();

    if (!title) {
      return {
        kind: "exclude",
        reason: "missing title"
      };
    }

    const includedKeyword = config.include.find((keyword) =>
      title.includes(keyword.toLowerCase())
    );

    if (!includedKeyword) {
      return {
        kind: "exclude",
        reason: "title did not match any include keyword"
      };
    }

    const excludedKeyword = config.exclude.find((keyword) =>
      title.includes(keyword.toLowerCase())
    );

    if (excludedKeyword) {
      return {
        kind: "exclude",
        reason: `title matched excluded keyword: ${excludedKeyword}`
      };
    }

    return {
      kind: "include"
    };
  }
});
