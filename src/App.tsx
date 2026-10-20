import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  advanceLevel,
  ATTEMPT_LIMIT,
  DAILY_THEME,
  getDailyPackId,
  HINT_AFTER_ERRORS,
  levels,
  loadProgress,
  requestHint,
  saveProgress,
  submitGuess,
  TIME_ZONE,
  type GameProgress,
  type LevelProgress,
  type SemanticTier,
} from "./game";

type Preferences = { theme: "light" | "dark"; textScale: number };
const PREFERENCE_KEY = "palavra-do-dia:preferences:v1";
const semanticLabels: Record<SemanticTier, string> = {
  1: "Relação distante",
  2: "Associação leve",
  3: "Relação possível",
  4: "Bem relacionado",
  5: "Muito próximo",
};
const getSemanticLabel = (tier: SemanticTier | null) =>
  tier === null ? "Sem relação cadastrada" : semanticLabels[tier];

function loadPreferences(): { value: Preferences; warning: boolean } {
  try {
    const raw = localStorage.getItem(PREFERENCE_KEY);
    if (!raw) return { value: { theme: "light", textScale: 1 }, warning: false };
    const value: unknown = JSON.parse(raw);
    if (value && typeof value === "object") {
      const preference = value as Partial<Preferences>;
      if ((preference.theme === "light" || preference.theme === "dark") &&
          typeof preference.textScale === "number" &&
          preference.textScale >= 0.9 && preference.textScale <= 1.15) {
        return { value: { theme: preference.theme, textScale: preference.textScale }, warning: false };
      }
    }
  } catch {
    return { value: { theme: "light", textScale: 1 }, warning: true };
  }
  return { value: { theme: "light", textScale: 1 }, warning: true };
}

function formatDate(dateId: string): string {
  const date = new Date(`${dateId}T12:00:00Z`);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(date);
}

function LevelItem({
  index,
  current,
  complete,
}: {
  index: number;
  current: boolean;
  complete: boolean;
}) {
  return (
    <li className={`level-item${current ? " current" : ""}${complete ? " done" : ""}${!current && !complete ? " locked" : ""}`}
      aria-label={`Nível ${index + 1}, ${complete ? "concluído" : current ? "atual" : "bloqueado"}`}
      aria-current={current ? "step" : undefined}>
      <span className="level-number" aria-hidden="true">{complete ? "✓" : String(index + 1).padStart(2, "0")}</span>
      <span>{complete ? levels[index].title : current ? levels[index].title : "Próxima palavra"}</span>
      <span className="level-state">{complete ? "feito" : current ? "agora" : "bloqueado"}</span>
    </li>
  );
}

function GuessHistory({ level, progress }: { level: LevelProgress; progress: GameProgress }) {
  const wordLength = [...levels[progress.currentLevel].answer].length;
  return (
    <div className="word-grid" role="log" aria-label="Histórico de tentativas" aria-live="polite">
      {level.guesses.map((guess, rowIndex) => (
        <div className="guess-row" key={`${guess.word}-${rowIndex}`}>
          <div className="letter-tiles" style={{ gridTemplateColumns: `repeat(${wordLength}, minmax(0, 1fr))` }}>
            {[...guess.word].map((letter, index) => (
              <span className={`tile ${guess.letters[index]}`} key={`${index}-${letter}`}>
                {letter}
                <span className="sr-only">
                  {guess.letters[index] === "correct"
                    ? "letra correta na posição certa"
                    : guess.letters[index] === "present"
                      ? "letra presente em outra posição"
                      : "letra não encontrada"}
                </span>
              </span>
            ))}
          </div>
          <span className="semantic-tag">
            Significado
            <strong>{getSemanticLabel(guess.semanticTier)}</strong>
          </span>
        </div>
      ))}
      {level.status === "playing" && Array.from({ length: Math.max(0, ATTEMPT_LIMIT - level.guesses.length) }, (_, index) => (
        <div className="empty-row" aria-hidden="true" key={`empty-${index}`}>
          <span className="empty-tiles" style={{ gridTemplateColumns: `repeat(${wordLength}, minmax(0, 1fr))` }}>
            {Array.from({ length: wordLength }, (_, tile) => <i key={tile} />)}
          </span>
          <span className="empty-label">tentativa {level.guesses.length + index + 1}</span>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [dateId, setDateId] = useState(() => getDailyPackId());
  const [progress, setProgress] = useState<GameProgress>(() => loadProgress(dateId).progress);
  const [initialPreferences] = useState(loadPreferences);
  const [preferences, setPreferences] = useState(initialPreferences.value);
  const [message, setMessage] = useState(() => loadProgress(dateId).notice);
  const [storageWarning, setStorageWarning] = useState(initialPreferences.warning);
  const levelIndex = progress.currentLevel;
  const level = levels[Math.min(levelIndex, levels.length - 1)];
  const active = progress.levels[Math.min(levelIndex, levels.length - 1)];
  const errors = active.guesses.filter((guess) => guess.word !== level.answer).length;
  const latestSemanticTier = active.guesses.at(-1)?.semanticTier ?? null;
  const remaining = Math.max(0, ATTEMPT_LIMIT - active.guesses.length);
  const gameComplete = levelIndex >= levels.length;
  const levelFinished = active.status !== "playing";

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.style.setProperty("--text-scale", String(preferences.textScale));
    try {
      localStorage.setItem(PREFERENCE_KEY, JSON.stringify(preferences));
    } catch {
      setStorageWarning(true);
    }
  }, [preferences]);

  useEffect(() => {
    if (!saveProgress(progress)) setStorageWarning(true);
  }, [progress]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const newDate = getDailyPackId();
      if (newDate === dateId) return;
      const daily = loadProgress(newDate);
      setDateId(newDate);
      setProgress(daily.progress);
      setMessage(daily.notice || "Um novo desafio diário está disponível.");
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [dateId]);

  function handleGuess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = new FormData(form).get("guess");
    const result = submitGuess(progress, level, typeof input === "string" ? input : "", levelIndex);
    setMessage(result.message);
    if (result.progress !== progress) {
      setProgress(result.progress);
      form.reset();
    }
  }

  function revealHint() {
    setProgress((current) => requestHint(current, levelIndex));
    setMessage("Dica revelada. Ela não consome uma tentativa.");
  }

  function nextLevel() {
    setProgress((current) => advanceLevel(current));
    setMessage("");
  }

  function changeTextScale(amount: number) {
    setPreferences((current) => ({
      ...current,
      textScale: Math.max(0.9, Math.min(1.15, Math.round((current.textScale + amount) * 100) / 100)),
    }));
  }

  return (
    <div className="shell">
      <header className="masthead">
        <a className="brand" href="./" aria-label="Palavra do dia, início">
          <span className="brand-mark" aria-hidden="true">P</span>
          <span>PALAVRA DO DIA</span>
        </a>
        <div className="utilities" aria-label="Preferências visuais">
          <div className="utility-group" aria-label="Tamanho do texto">
            <span className="utility-label">Texto</span>
            <button className="icon-button" type="button" onClick={() => changeTextScale(-0.05)} aria-label="Diminuir tamanho do texto">A−</button>
            <button className="icon-button" type="button" onClick={() => changeTextScale(0.05)} aria-label="Aumentar tamanho do texto">A+</button>
          </div>
          <button className="mode-button" type="button" aria-pressed={preferences.theme === "dark"}
            onClick={() => setPreferences((current) => ({ ...current, theme: current.theme === "dark" ? "light" : "dark" }))}>
            {preferences.theme === "dark" ? "☼ Tema claro" : "◐ Tema escuro"}
          </button>
        </div>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Desafio diário · {formatDate(dateId)}</p>
          <h1 id="page-title">Descobrir palavras.<br />Ampliar repertório.</h1>
        </div>
        <p className="intro-note">Uma trilha pela natureza, com pistas sobre letras e relações de significado. Jogue no seu ritmo: sua sequência não é cobrada.</p>
      </section>

      {storageWarning && <p className="storage-warning" role="status">O navegador não conseguiu salvar seus dados. A partida segue disponível nesta aba.</p>}

      <main className="game-layout">
        <aside className="progress-panel" aria-label="Progresso do desafio">
          <p className="panel-kicker">Desafio diário</p>
          <p className="daily-theme">{DAILY_THEME}</p>
          <p className="daily-date">{formatDate(dateId)}</p>
          <p className="panel-kicker">Seu percurso <span>{Math.min(levelIndex + (levelFinished ? 1 : 0), levels.length)} de {levels.length}</span></p>
          <ol className="level-list" aria-label="Dez níveis do desafio">
            {levels.map((item, index) => (
              <LevelItem key={item.id} index={index} current={index === levelIndex && !gameComplete}
                complete={progress.levels[index].status !== "playing"} />
            ))}
          </ol>
          <p className="progress-foot">Sem sequência obrigatória. Seu progresso fica salvo neste navegador.</p>
        </aside>

        <section className="play-panel" aria-labelledby="level-title">
          {gameComplete ? (
            <div className="completion-panel" role="status">
              <p className="level-tag">DESAFIO CONCLUÍDO</p>
              <h2 id="level-title">Você percorreu a trilha!</h2>
              <p>Você resolveu {progress.levelsSolved} de {levels.length} palavras e usou {progress.totalGuesses} palpites neste navegador.</p>
              <p>Um novo desafio estará disponível na próxima virada do dia.</p>
            </div>
          ) : (
            <>
              <div className="play-topline">
                <span className="level-tag">NÍVEL {String(levelIndex + 1).padStart(2, "0")} / {levels.length}</span>
                <span className="attempt-counter">{errors} erros · {remaining} tentativas restantes</span>
              </div>
              <h2 id="level-title">{level.title}</h2>
              <p className="word-meta">Tema de hoje: natureza <span aria-hidden="true">·</span> palavra com {[...level.answer].length} letras</p>
              <GuessHistory level={active} progress={progress} />
              {levelFinished ? (
                <div className="result-panel" role="status" aria-live="polite">
                  <p className="result-kicker">{active.status === "solved" ? "Muito bem!" : "Fim das tentativas"}</p>
                  <p className="result-answer">A resposta era <strong>{level.answer}</strong>.</p>
                  <p>{level.definition}</p>
                  <blockquote>“{level.example}”</blockquote>
                  <button className="submit-button next-button" type="button" onClick={nextLevel}>
                    {levelIndex === levels.length - 1 ? "Concluir desafio" : "Avançar para o próximo nível"}
                  </button>
                </div>
              ) : (
                <form className="guess-form" onSubmit={handleGuess} autoComplete="off">
                  <label className="sr-only" htmlFor="guess-input">Digite uma palavra com {[...level.answer].length} letras</label>
                  <input className="guess-input" id="guess-input" name="guess" type="text"
                    maxLength={[...level.answer].length} placeholder="Digite uma palavra"
                    aria-describedby="input-message" autoCapitalize="characters" spellCheck={false} required />
                  <button className="submit-button" type="submit">Enviar palpite</button>
                </form>
              )}
              <p className="input-message" id="input-message" role="status" aria-live="polite">
                {message || "Palpites inválidos ou repetidos não consomem tentativas."}
              </p>
              <div className="turn-foot">
                <span>Limite: <strong>{ATTEMPT_LIMIT} tentativas por nível</strong></span>
                <span>Progresso salvo localmente</span>
              </div>
            </>
          )}
        </section>

        <aside className="clue-panel" aria-label="Pistas e opções">
          {!gameComplete && <>
            <section className="semantic-box" aria-labelledby="semantic-heading">
              <div className="semantic-title">
                <h3 id="semantic-heading">Proximidade de significado</h3>
                <span>escala editorial</span>
              </div>
              <div className="semantic-scale" role="img" aria-label={`Escala de proximidade de um a cinco. Último palpite: ${active.guesses.length ? getSemanticLabel(latestSemanticTier) : "nenhum palpite"}`}>
                {Array.from({ length: 5 }, (_, index) => (
                  <span className={`semantic-segment${latestSemanticTier !== null && index < latestSemanticTier ? " active" : ""}`} key={index} />
                ))}
              </div>
              <div className="semantic-summary"><span>Mais distante</span><strong>{active.guesses.length ? getSemanticLabel(latestSemanticTier) : "Aguardando palpite"}</strong></div>
              <p className="clue-note">Relações preparadas e revisadas para este desafio; não representam uma medida científica.</p>
            </section>
            <section className="hint-box" aria-labelledby="hint-heading">
              <h3 id="hint-heading">Uma mãozinha?</h3>
              <p className="hint-copy" id="hint-copy">A dica opcional aparece após cinco erros neste nível e não consome tentativa.</p>
              <button className="hint-button" type="button"
                disabled={errors < HINT_AFTER_ERRORS || active.hintRevealed || levelFinished}
                aria-describedby="hint-copy"
                onClick={revealHint}>
                {active.hintRevealed ? "Sinônimo revelado" : errors >= HINT_AFTER_ERRORS ? "Ver sinônimo · opcional" : `Disponível após 5 erros · ${Math.max(0, HINT_AFTER_ERRORS - errors)} restantes`}
              </button>
              {active.hintRevealed && <p className="hint-result" role="status">Sinônimo: <strong>{level.hintSynonym}</strong></p>}
            </section>
            <section className="access-note" aria-labelledby="access-heading">
              <h3 id="access-heading">Pistas que não dependem só de cor</h3>
              <p>As letras têm rótulos acessíveis, o foco é visível e o texto pode ser ampliado. Você também pode jogar usando apenas o teclado.</p>
            </section>
          </>}
        </aside>
      </main>

      <footer className="prototype-foot">
        <p>Desafio temático demonstrativo. As relações de significado e o vocabulário aceito são editoriais e podem ser ampliados em novos pacotes.</p>
        <p>Sem cadastro, sem coleta de dados e sem sincronização entre dispositivos.</p>
      </footer>
    </div>
  );
}
