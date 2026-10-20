import dailyPack from "./data/daily-packs/2026-10-20.json";

export type LetterState = "correct" | "present" | "absent";
export type SemanticTier = 1 | 2 | 3 | 4 | 5;
export type LevelStatus = "playing" | "solved" | "exhausted";

export interface Level {
  id: string;
  title: string;
  answer: string;
  definition: string;
  example: string;
  hintSynonym: string;
  semanticIndex: Record<string, SemanticTier>;
}

export interface Guess {
  word: string;
  letters: LetterState[];
  semanticTier: SemanticTier | null;
}

export interface LevelProgress {
  guesses: Guess[];
  hintRevealed: boolean;
  status: LevelStatus;
}

export interface GameProgress {
  packDate: string;
  currentLevel: number;
  levels: LevelProgress[];
  daysPlayed: string[];
  levelsSolved: number;
  totalGuesses: number;
}

export const ATTEMPT_LIMIT = dailyPack.attemptLimit;
export const HINT_AFTER_ERRORS = dailyPack.hintAfterErrors;
export const STORAGE_KEY = "palavra-do-dia:save:v1";
export const TIME_ZONE = dailyPack.timezone;
export const DAILY_THEME = dailyPack.theme.title;

export function normalizeWord(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleUpperCase("pt-BR")
    .trim();
}

function isSemanticTier(value: unknown): value is SemanticTier {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
}

function validateSemanticIndex(index: object): Record<string, SemanticTier> {
  const validated: Record<string, SemanticTier> = {};
  for (const [word, tier] of Object.entries(index)) {
    if (!isSemanticTier(tier)) {
      throw new Error(`Faixa semântica inválida para "${word}" no pacote diário.`);
    }
    validated[word] = tier;
  }
  return validated;
}

export const levels: Level[] = dailyPack.levels.map((level) => ({
  ...level,
  semanticIndex: validateSemanticIndex(level.semanticIndex),
}));

export const acceptedWords = new Set(dailyPack.acceptedWords.map(normalizeWord));

export function evaluateLetters(guess: string, answer: string): LetterState[] {
  const normalizedGuess = [...normalizeWord(guess)];
  const normalizedAnswer = [...normalizeWord(answer)];
  const feedback: LetterState[] = Array(normalizedGuess.length).fill("absent");
  const remaining = [...normalizedAnswer];

  normalizedGuess.forEach((letter, index) => {
    if (letter === normalizedAnswer[index]) {
      feedback[index] = "correct";
      remaining[index] = "";
    }
  });

  normalizedGuess.forEach((letter, index) => {
    if (feedback[index] === "correct") return;
    const match = remaining.indexOf(letter);
    if (match !== -1) {
      feedback[index] = "present";
      remaining[match] = "";
    }
  });

  return feedback;
}

export function getSemanticTier(guess: string, level: Level): SemanticTier | null {
  const normalizedGuess = normalizeWord(guess);
  if (normalizedGuess === normalizeWord(level.answer)) return 5;
  const matchingKey = Object.keys(level.semanticIndex)
    .find((word) => normalizeWord(word) === normalizedGuess);
  return matchingKey ? level.semanticIndex[matchingKey] : null;
}

export function getDailyPackId(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function createInitialProgress(packDate: string): GameProgress {
  return {
    packDate,
    currentLevel: 0,
    levels: levels.map(() => ({ guesses: [], hintRevealed: false, status: "playing" })),
    daysPlayed: [],
    levelsSolved: 0,
    totalGuesses: 0,
  };
}

export function isValidProgress(value: unknown): value is GameProgress {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<GameProgress>;
  return (
    typeof candidate.packDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(candidate.packDate) &&
    Number.isInteger(candidate.currentLevel) &&
    (candidate.currentLevel ?? -1) >= 0 &&
    (candidate.currentLevel ?? levels.length) <= levels.length &&
    Array.isArray(candidate.levels) &&
    candidate.levels.length === levels.length &&
    candidate.levels.every((level, index) => {
      if (!level || typeof level !== "object" || !Array.isArray(level.guesses) ||
          level.guesses.length > ATTEMPT_LIMIT || typeof level.hintRevealed !== "boolean" ||
          !["playing", "solved", "exhausted"].includes(level.status)) return false;
      const answer = levels[index].answer;
      const answerLength = [...normalizeWord(answer)].length;
      const validGuesses = level.guesses.every((guess) => {
        if (!guess || typeof guess !== "object" || typeof guess.word !== "string" ||
            !acceptedWords.has(normalizeWord(guess.word)) || [...normalizeWord(guess.word)].length !== answerLength ||
            !Array.isArray(guess.letters) || guess.letters.length !== answerLength ||
            !guess.letters.every((letter) => ["correct", "present", "absent"].includes(letter)) ||
            (guess.semanticTier !== null && ![1, 2, 3, 4, 5].includes(guess.semanticTier))) return false;
        return JSON.stringify(guess.letters) === JSON.stringify(evaluateLetters(guess.word, answer));
      });
      if (!validGuesses) return false;
      const errors = level.guesses.filter((guess) => normalizeWord(guess.word) !== normalizeWord(answer)).length;
      const containsAnswer = errors !== level.guesses.length;
      if (level.hintRevealed && errors < HINT_AFTER_ERRORS) return false;
      if (level.status === "solved" && !containsAnswer) return false;
      if (level.status === "exhausted" && (containsAnswer || level.guesses.length !== ATTEMPT_LIMIT)) return false;
      return level.status !== "playing" || (!containsAnswer && level.guesses.length < ATTEMPT_LIMIT);
    }) &&
    Array.isArray(candidate.daysPlayed) &&
    candidate.daysPlayed.length <= 30 &&
    candidate.daysPlayed.every((date) => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) &&
    Number.isInteger(candidate.levelsSolved) && (candidate.levelsSolved ?? -1) >= 0 &&
    Number.isInteger(candidate.totalGuesses) && (candidate.totalGuesses ?? -1) >= 0
  );
}

export function submitGuess(
  progress: GameProgress,
  level: Level,
  rawGuess: string,
  levelIndex: number,
): { progress: GameProgress; message: string } {
  const guess = normalizeWord(rawGuess);
  const active = progress.levels[levelIndex];
  const requiredLength = [...normalizeWord(level.answer)].length;

  if (!/^\p{L}+$/u.test(guess)) {
    return { progress, message: "Use apenas letras; espaços e símbolos não são aceitos." };
  }
  if ([...guess].length !== requiredLength) {
    return { progress, message: `Este nível pede uma palavra com ${requiredLength} letras.` };
  }
  if (!acceptedWords.has(guess)) {
    return { progress, message: "Essa palavra não está no vocabulário deste jogo." };
  }
  if (active.guesses.some((entry) => entry.word === guess)) {
    return { progress, message: "Esse palpite já apareceu neste nível." };
  }

  const isCorrect = guess === normalizeWord(level.answer);
  const record: Guess = {
    word: guess,
    letters: evaluateLetters(guess, level.answer),
    semanticTier: getSemanticTier(guess, level),
  };
  const updatedLevel: LevelProgress = {
    ...active,
    guesses: [...active.guesses, record],
    status: isCorrect
      ? "solved"
      : active.guesses.length + 1 >= ATTEMPT_LIMIT
        ? "exhausted"
        : "playing",
  };
  const playedDates = progress.daysPlayed.includes(progress.packDate)
    ? progress.daysPlayed
    : [...progress.daysPlayed.slice(-29), progress.packDate];

  return {
    progress: {
      ...progress,
      daysPlayed: playedDates,
      totalGuesses: progress.totalGuesses + 1,
      levelsSolved: progress.levelsSolved + (isCorrect ? 1 : 0),
      levels: progress.levels.map((item, index) => (index === levelIndex ? updatedLevel : item)),
    },
    message: isCorrect
      ? "Resposta certa! Você concluiu este nível."
      : updatedLevel.status === "exhausted"
        ? "As tentativas acabaram. A resposta será revelada abaixo."
        : "Palpite registrado. Confira as pistas de letras e significado.",
  };
}

export function requestHint(progress: GameProgress, levelIndex: number): GameProgress {
  const active = progress.levels[levelIndex];
  if (active.guesses.filter((guess) => guess.word !== normalizeWord(levels[levelIndex].answer)).length < HINT_AFTER_ERRORS ||
      active.hintRevealed || active.status !== "playing") {
    return progress;
  }

  return {
    ...progress,
    levels: progress.levels.map((item, index) =>
      index === levelIndex ? { ...item, hintRevealed: true } : item,
    ),
  };
}

export function advanceLevel(progress: GameProgress): GameProgress {
  const active = progress.levels[progress.currentLevel];
  if (!active || active.status === "playing") return progress;
  return {
    ...progress,
    currentLevel: Math.min(progress.currentLevel + 1, levels.length),
  };
}

export function loadProgress(packDate: string): { progress: GameProgress; notice: string } {
  const initial = createInitialProgress(packDate);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { progress: initial, notice: "" };
    const parsed: unknown = JSON.parse(raw);
    if (!isValidProgress(parsed)) {
      return { progress: initial, notice: "O progresso salvo estava inválido e foi reiniciado para este desafio." };
    }
    return parsed.packDate === packDate
      ? { progress: parsed, notice: "" }
      : { progress: { ...initial, daysPlayed: parsed.daysPlayed, levelsSolved: parsed.levelsSolved, totalGuesses: parsed.totalGuesses }, notice: "" };
  } catch {
    return { progress: initial, notice: "Não foi possível ler o progresso salvo. A partida atual ainda pode ser jogada." };
  }
}

export function saveProgress(progress: GameProgress): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
