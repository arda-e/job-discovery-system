import type { CandidateFilter } from "../../../src/domain/filters/types";
import {
  evaluateCandidate,
  evaluateCandidates
} from "../../../src/domain/filters/pipeline";

describe("evaluateCandidate", () => {
  const candidate = {
    title: "Software Engineer - ACME",
    url: "https://jobs.example.com/acme/software-engineer"
  };

  it("returns an accepted evaluation when all filters include", () => {
    const firstFilter: CandidateFilter = {
      name: "first",
      evaluate: jest.fn(() => ({ kind: "include" }))
    };
    const secondFilter: CandidateFilter = {
      name: "second",
      evaluate: jest.fn(() => ({ kind: "include" }))
    };

    expect(evaluateCandidate(candidate, [firstFilter, secondFilter])).toEqual({
      accepted: true,
      candidate
    });
    expect(firstFilter.evaluate).toHaveBeenCalledTimes(1);
    expect(secondFilter.evaluate).toHaveBeenCalledTimes(1);
  });

  it("short-circuits on the first exclusion", () => {
    const firstFilter: CandidateFilter = {
      name: "first",
      evaluate: jest.fn(() => ({
        kind: "exclude",
        reason: "first filter rejected"
      }))
    };
    const secondFilter: CandidateFilter = {
      name: "second",
      evaluate: jest.fn(() => ({ kind: "include" }))
    };

    expect(evaluateCandidate(candidate, [firstFilter, secondFilter])).toEqual({
      accepted: false,
      candidate,
      excludedBy: "first",
      reason: "first filter rejected"
    });
    expect(firstFilter.evaluate).toHaveBeenCalledTimes(1);
    expect(secondFilter.evaluate).not.toHaveBeenCalled();
  });
});

describe("evaluateCandidates", () => {
  it("evaluates candidates in order and preserves the input order", () => {
    const candidateOne = {
      title: "Software Engineer - One",
      url: "https://jobs.example.com/one/software-engineer"
    };
    const candidateTwo = {
      title: "Software Engineer - Two",
      url: "https://jobs.example.com/two/software-engineer"
    };
    const filter: CandidateFilter = {
      name: "include-all",
      evaluate: jest.fn(() => ({ kind: "include" }))
    };

    expect(evaluateCandidates([candidateOne, candidateTwo], [filter])).toEqual([
      {
        accepted: true,
        candidate: candidateOne
      },
      {
        accepted: true,
        candidate: candidateTwo
      }
    ]);
  });

  it("returns an empty array for an empty candidate list", () => {
    const filter: CandidateFilter = {
      name: "include-all",
      evaluate: jest.fn(() => ({ kind: "include" }))
    };

    expect(evaluateCandidates([], [filter])).toEqual([]);
  });
});
