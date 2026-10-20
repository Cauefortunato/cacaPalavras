import { describe, expect, it } from "vitest";
import {
  advanceLevel,
  acceptedWords,
  createInitialProgress,
  evaluateLetters,
  getDailyPackId,
  getSemanticTier,
  isValidProgress,
  levels,
  normalizeWord,
  requestHint,
  submitGuess,
} from "./game";

describe("game domain", () => {
  it("normalizes accents without changing the displayed answer", () => {
    expect(normalizeWord("ação")).toBe("ACAO");
    expect(levels[0].answer).toBe("SOL");
  });

  it("matches semantic index entries regardless of accent", () => {
    expect(getSemanticTier("CEU", levels[0])).toBe(3);
    expect(getSemanticTier("MAR", levels[0])).toBeNull();
  });

  it("rejects malformed local progress safely", () => {
    const invalid = createInitialProgress("2026-10-20");
    (invalid.levels[0].guesses as unknown[]).push(null);
    expect(isValidProgress(invalid)).toBe(false);
  });

  it("matches duplicate letters in two passes", () => {
    expect(evaluateLetters("ARARA", "RAIVA")).toEqual([
      "present",
      "present",
      "absent",
      "absent",
      "correct",
    ]);
  });

  it("provides ten levels with non-decreasing answer lengths", () => {
    expect(levels).toHaveLength(10);
    const lengths = levels.map((level) => [...level.answer].length);
    expect(lengths[0]).toBe(3);
    expect(lengths.at(-1)).toBe(8);
    expect(lengths).toEqual([...lengths].sort((left, right) => left - right));
  });

  it("includes each same-length semantic clue in the accepted vocabulary", () => {
    for (const level of levels) {
      const answerLength = [...level.answer].length;
      for (const word of Object.keys(level.semanticIndex)) {
        if ([...normalizeWord(word)].length === answerLength) {
          expect(acceptedWords.has(normalizeWord(word))).toBe(true);
        }
      }
    }
  });

  it("does not spend an attempt on an unknown word or duplicate guess", () => {
    const initial = createInitialProgress("2026-10-20");
    const invalid = submitGuess(initial, levels[0], "ZZZ", 0);
    expect(invalid.progress.levels[0].guesses).toHaveLength(0);
    const valid = submitGuess(initial, levels[0], "LUA", 0);
    const duplicate = submitGuess(valid.progress, levels[0], "LUA", 0);
    expect(duplicate.progress.levels[0].guesses).toHaveLength(1);
  });

  it("reveals a hint only after five valid errors and advances after a terminal level", () => {
    let progress = createInitialProgress("2026-10-20");
    for (const guess of ["LUA", "MAR", "RIO", "CEU", "LUZ"]) {
      progress = submitGuess(progress, levels[0], guess, 0).progress;
    }
    expect(requestHint(progress, 0).levels[0].hintRevealed).toBe(true);
    progress = submitGuess(progress, levels[0], "SOL", 0).progress;
    expect(advanceLevel(progress).currentLevel).toBe(1);
  });

  it("ends and allows advancing after eight valid incorrect guesses", () => {
    let progress = createInitialProgress("2026-10-20");
    for (const guess of ["LUA", "MAR", "RIO", "CEU", "LUZ", "MEL", "LAR", "SAL"]) {
      progress = submitGuess(progress, levels[0], guess, 0).progress;
    }
    expect(progress.levels[0].status).toBe("exhausted");
    expect(progress.levels[0].guesses).toHaveLength(8);
    expect(advanceLevel(progress).currentLevel).toBe(1);
  });

  it("uses the São Paulo civil date", () => {
    expect(getDailyPackId(new Date("2026-10-20T02:30:00.000Z"))).toBe("2026-10-19");
  });
});
