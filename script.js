import React, { useEffect, useMemo, useState } from "react";

const PLAYERS = [
  { id: "William", name: "William", palette: { skin: "#c68642", hair: "#2b1b0f", shirt: "#9b5de5", pants: "#3a86ff" } },
  { id: "Rylan", name: "Rylan", palette: { skin: "#b87333", hair: "#111827", shirt: "#f97316", pants: "#2563eb" } },
  { id: "Nickeel", name: "Nickeel", palette: { skin: "#5c3b28", hair: "#111111", shirt: "#22c55e", pants: "#1d4ed8" } },
  { id: "Kgothatso", name: "Kgothatso", palette: { skin: "#f1c27d", hair: "#3f3f46", shirt: "#06b6d4", pants: "#475569" } },
];

const STORAGE_KEYS = {
  clicks: "dailyClicks",
  guesses: "dailyGuesses",
  winners: "dailyWinners",
};

function getTodayKey() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

function getDayName(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

function isAfterCutoff(now = new Date()) {
  const hours = now.getHours();
  const minutes = now.getMinutes();
  return hours > 9 || (hours === 9 && minutes >= 10);
}

function loadStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

function PixelCharacter({ player, wins, active }) {
  return (
    <div className={`flex flex-col items-center gap-2 transition-transform ${active ? "scale-105" : "scale-100"}`}>
      <div className="relative w-16 h-24 drop-shadow-[0_4px_0_rgba(0,0,0,0.45)]">
        <div className="absolute inset-x-3 top-1 h-3" style={{ backgroundColor: player.palette.hair }} />
        <div className="absolute inset-x-4 top-4 h-5 border border-black/50" style={{ backgroundColor: player.palette.skin }} />
        <div className="absolute left-5 top-6 w-1 h-1 bg-black" />
        <div className="absolute right-5 top-6 w-1 h-1 bg-black" />
        <div className="absolute inset-x-3 top-10 h-7 border border-black/50" style={{ backgroundColor: player.palette.shirt }} />
        <div className="absolute left-3 top-11 w-2 h-6 border border-black/50" style={{ backgroundColor: player.palette.skin }} />
        <div className="absolute right-3 top-11 w-2 h-6 border border-black/50" style={{ backgroundColor: player.palette.skin }} />
        <div className="absolute left-4 top-[68px] w-3 h-8 border border-black/50" style={{ backgroundColor: player.palette.pants }} />
        <div className="absolute right-4 top-[68px] w-3 h-8 border border-black/50" style={{ backgroundColor: player.palette.pants }} />
      </div>
      <div className="rounded-md border-2 border-black/60 bg-[#2a2118] px-2 py-1 text-center text-[10px] sm:text-xs text-amber-100 min-w-20">
        <div className="font-bold">{player.name}</div>
        <div>{wins} wins</div>
      </div>
    </div>
  );
}

function CoinBurst({ bursts }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {bursts.map((coin) => (
        <div
          key={coin.id}
          className="absolute text-xl animate-[coin-fall_900ms_ease-in_forwards]"
          style={{ left: `${coin.left}%`, top: "5%" }}
        >
          🪙
        </div>
      ))}
      <style>{`
        @keyframes coin-fall {
          0% { transform: translateY(-10px) scale(0.7) rotate(0deg); opacity: 1; }
          100% { transform: translateY(180px) scale(1.1) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function TerrariaClickGuessMinigame() {
  const [currentDayKey, setCurrentDayKey] = useState(getTodayKey());
  const [dailyClicks, setDailyClicks] = useState(() => loadStorage(STORAGE_KEYS.clicks, { [getTodayKey()]: 0 }));
  const [dailyGuesses, setDailyGuesses] = useState(() => loadStorage(STORAGE_KEYS.guesses, { [getTodayKey()]: [] }));
  const [dailyWinners, setDailyWinners] = useState(() => loadStorage(STORAGE_KEYS.winners, {}));
  const [playerName, setPlayerName] = useState("");
  const [playerGuess, setPlayerGuess] = useState("");
  const [nextGuessCountdown, setNextGuessCountdown] = useState("");
  const [dayEndCountdown, setDayEndCountdown] = useState("");
  const [guessStatus, setGuessStatus] = useState("Guesses are open");
  const [bursts, setBursts] = useState([]);
  const [activeSprite, setActiveSprite] = useState(false);

  useEffect(() => saveStorage(STORAGE_KEYS.clicks, dailyClicks), [dailyClicks]);
  useEffect(() => saveStorage(STORAGE_KEYS.guesses, dailyGuesses), [dailyGuesses]);
  useEffect(() => saveStorage(STORAGE_KEYS.winners, dailyWinners), [dailyWinners]);

  const todayClicks = dailyClicks[currentDayKey] || 0;
  const todayGuesses = dailyGuesses[currentDayKey] || [];

  const scores = useMemo(() => {
    const base = Object.fromEntries(PLAYERS.map((p) => [p.name, 0]));
    Object.values(dailyWinners).forEach((winner) => {
      if (winner?.name && Object.prototype.hasOwnProperty.call(base, winner.name)) {
        base[winner.name] += 1;
      }
    });
    return Object.entries(base).sort((a, b) => b[1] - a[1]);
  }, [dailyWinners]);

  function autoClosePreviousDay(dayKey, clicksState, guessesState, winnersState) {
    const guesses = guessesState[dayKey] || [];
    const actual = clicksState[dayKey] || 0;
    if (winnersState[dayKey]) return winnersState;

    const next = { ...winnersState };
    if (guesses.length === 0) {
      next[dayKey] = { name: "No guesses", guess: "-", actual, difference: "-" };
      return next;
    }

    let winner = guesses[0];
    let smallestDifference = Math.abs(guesses[0].guess - actual);

    for (let i = 1; i < guesses.length; i += 1) {
      const difference = Math.abs(guesses[i].guess - actual);
      if (difference < smallestDifference) {
        smallestDifference = difference;
        winner = guesses[i];
      }
    }

    next[dayKey] = {
      name: winner.name,
      guess: winner.guess,
      actual,
      difference: smallestDifference,
    };
    return next;
  }

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const realToday = getTodayKey();

      if (realToday !== currentDayKey) {
        setDailyWinners((prev) => autoClosePreviousDay(currentDayKey, dailyClicks, dailyGuesses, prev));
        setCurrentDayKey(realToday);
        setDailyClicks((prev) => ({ ...prev, [realToday]: prev[realToday] || 0 }));
        setDailyGuesses((prev) => ({ ...prev, [realToday]: prev[realToday] || [] }));
      }

      const nextGuessTime = new Date();
      nextGuessTime.setHours(9, 10, 0, 0);
      if (now >= nextGuessTime) nextGuessTime.setDate(nextGuessTime.getDate() + 1);
      setNextGuessCountdown(`Next guess window in: ${formatCountdown(nextGuessTime - now)}`);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      setDayEndCountdown(`Today ends in: ${formatCountdown(endOfDay - now)}`);

      const clicks = dailyClicks[currentDayKey] || 0;
      if (clicks > 0) {
        setGuessStatus("Guesses are locked because clicking has started");
      } else {
        setGuessStatus(isAfterCutoff(now) ? "Guesses are locked after 9:10 AM" : "Guesses are open until 9:10 AM");
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [currentDayKey, dailyClicks, dailyGuesses]);

  const guessesLocked = isAfterCutoff() || todayClicks > 0;

  function addClick() {
    const nowKey = getTodayKey();
    if (nowKey !== currentDayKey) return;

    setDailyClicks((prev) => ({ ...prev, [currentDayKey]: (prev[currentDayKey] || 0) + 1 }));
    setActiveSprite(true);
    setTimeout(() => setActiveSprite(false), 180);

    const id = Date.now() + Math.random();
    setBursts((prev) => [...prev, { id, left: 20 + Math.random() * 55 }]);
    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id));
    }, 900);
  }

  function saveGuess() {
    if (guessesLocked) {
      window.alert("Guesses are locked. They close at 9:10 AM or when clicking starts.");
      return;
    }

    const guessNumber = parseInt(playerGuess, 10);
    if (!playerName || Number.isNaN(guessNumber)) {
      window.alert("Choose a player and enter a valid guess.");
      return;
    }

    const alreadyGuessed = todayGuesses.some((entry) => entry.name === playerName);
    if (alreadyGuessed) {
      window.alert(`${playerName} has already made a guess for today.`);
      return;
    }

    setDailyGuesses((prev) => ({
      ...prev,
      [currentDayKey]: [...(prev[currentDayKey] || []), { name: playerName, guess: guessNumber }],
    }));
    setPlayerGuess("");
  }

  function resetWholeSite() {
    const ok = window.prompt("Enter admin code:");
    if (ok !== "UHH2026RESET") {
      if (ok !== null) window.alert("Wrong admin code.");
      return;
    }

    const confirmReset = window.confirm("Reset the whole site? This will delete all saved data.");
    if (!confirmReset) return;

    setDailyClicks({ [getTodayKey()]: 0 });
    setDailyGuesses({ [getTodayKey()]: [] });
    setDailyWinners({});
    setCurrentDayKey(getTodayKey());
    window.localStorage.removeItem(STORAGE_KEYS.clicks);
    window.localStorage.removeItem(STORAGE_KEYS.guesses);
    window.localStorage.removeItem(STORAGE_KEYS.winners);
  }

  useEffect(() => {
    let resetKeyCount = 0;
    let lastResetKeyTime = 0;

    const handler = (event) => {
      const now = Date.now();
      if (event.shiftKey && event.key.toLowerCase() === "r") {
        if (now - lastResetKeyTime > 2000) resetKeyCount = 0;
        resetKeyCount += 1;
        lastResetKeyTime = now;
        if (resetKeyCount === 3) {
          resetKeyCount = 0;
          resetWholeSite();
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#79c2ff] text-white overflow-hidden">
      <div className="h-24 bg-gradient-to-b from-[#9be3ff] to-[#79c2ff]" />
      <div className="border-y-8 border-[#5b3b1f] bg-[#6eb24f] px-4 py-6 shadow-[inset_0_6px_0_rgba(255,255,255,0.2)]">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 rounded-none border-4 border-[#3d2614] bg-[#6b4a2c] p-4 shadow-[8px_8px_0_rgba(0,0,0,0.35)]">
            <h1 className="text-3xl sm:text-4xl font-black tracking-wide text-[#ffe7a3]">UHH TERRARIA CLICK GUESS GAME</h1>
            <p className="mt-2 text-sm sm:text-base text-[#f8e7c1]">Guess today&apos;s clicks. Closest guess wins. Terraria-style village edition.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="relative rounded-none border-4 border-[#3d2614] bg-[#7a5533] p-4 shadow-[8px_8px_0_rgba(0,0,0,0.35)]">
                <div className="absolute inset-x-0 top-0 h-3 bg-[#a97a4c]" />
                <h2 className="mb-4 text-2xl font-black text-[#ffe7a3]">Today&apos;s Clicker</h2>
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="space-y-2 text-[#fff1cf]">
                    <p><span className="font-black">Day:</span> {getDayName(currentDayKey)}</p>
                    <p><span className="font-black">Date:</span> {currentDayKey}</p>
                    <p className="font-black text-yellow-200">{guessStatus}</p>
                    <p className="text-cyan-100">{nextGuessCountdown}</p>
                    <p className="text-cyan-100">{dayEndCountdown}</p>
                    <p className="pt-2 text-xl"><span className="font-black">Today&apos;s Clicks:</span> {todayClicks}</p>
                  </div>

                  <div className="relative mx-auto w-64 h-64">
                    <CoinBurst bursts={bursts} />
                    <button
                      type="button"
                      onClick={addClick}
                      className={`absolute bottom-6 left-1/2 -translate-x-1/2 transition-transform ${activeSprite ? "scale-95" : "scale-100"}`}
                      aria-label="Click the terraria pot"
                    >
                      <div className="relative">
                        <img src="pot.jpg" alt="Pot" className={`w-40 h-40 object-contain pixelated ${activeSprite ? "animate-pulse" : ""}`} />
                        <div className="absolute inset-0 grid place-items-center text-2xl">🖱</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-none border-4 border-[#3d2614] bg-[#7a5533] p-4 shadow-[8px_8px_0_rgba(0,0,0,0.35)]">
                <h2 className="mb-4 text-2xl font-black text-[#ffe7a3]">Village Players</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#5f4127] p-4 border-4 border-[#3d2614]">
                  {PLAYERS.map((player) => {
                    const wins = scores.find((s) => s[0] === player.name)?.[1] || 0;
                    return <PixelCharacter key={player.id} player={player} wins={wins} active={playerName === player.name} />;
                  })}
                </div>
              </div>

              <div className="rounded-none border-4 border-[#3d2614] bg-[#7a5533] p-4 shadow-[8px_8px_0_rgba(0,0,0,0.35)]">
                <h2 className="mb-4 text-2xl font-black text-[#ffe7a3]">Enter a Guess</h2>
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <select
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="border-4 border-[#3d2614] bg-[#e7d6ad] px-3 py-2 text-black outline-none"
                  >
                    <option value="">Choose player</option>
                    {PLAYERS.map((player) => (
                      <option key={player.id} value={player.name}>{player.name}</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    value={playerGuess}
                    onChange={(e) => setPlayerGuess(e.target.value)}
                    placeholder="Enter your guess"
                    className="border-4 border-[#3d2614] bg-[#e7d6ad] px-3 py-2 text-black outline-none"
                  />

                  <button
                    type="button"
                    onClick={saveGuess}
                    className="border-4 border-[#3d2614] bg-[#d97706] px-4 py-2 font-black text-white shadow-[4px_4px_0_rgba(0,0,0,0.35)] active:translate-y-[2px]"
                  >
                    Save Guess
                  </button>
                </div>

                <div className="mt-5 border-4 border-[#3d2614] bg-[#5f4127] p-4">
                  <h3 className="mb-3 text-lg font-black text-[#ffe7a3]">Today&apos;s Guesses</h3>
                  <ul className="space-y-2 text-[#fff1cf]">
                    {todayGuesses.length === 0 ? (
                      <li>No guesses yet</li>
                    ) : (
                      todayGuesses.map((entry, index) => (
                        <li key={`${entry.name}-${index}`} className="border-b border-[#8f6a43] pb-2">
                          {entry.name} guessed {entry.guess}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-none border-4 border-[#3d2614] bg-[#7a5533] p-4 shadow-[8px_8px_0_rgba(0,0,0,0.35)]">
                <h2 className="mb-4 text-2xl font-black text-[#ffe7a3]">Daily Results</h2>
                <ul className="space-y-3 text-[#fff1cf]">
                  {Object.keys(dailyWinners).length === 0 ? (
                    <li>No completed results yet</li>
                  ) : (
                    Object.keys(dailyWinners)
                      .sort()
                      .reverse()
                      .map((date) => {
                        const result = dailyWinners[date];
                        return (
                          <li key={date} className="border-4 border-[#3d2614] bg-[#5f4127] p-3">
                            {getDayName(date)} ({date}) — Winner: {result.name}, Guess: {result.guess}, Actual: {result.actual}
                          </li>
                        );
                      })
                  )}
                </ul>
              </div>

              <div className="rounded-none border-4 border-[#3d2614] bg-[#7a5533] p-4 shadow-[8px_8px_0_rgba(0,0,0,0.35)]">
                <h2 className="mb-4 text-2xl font-black text-[#ffe7a3]">Top 4 Leaderboard</h2>
                <ol className="space-y-3 text-[#fff1cf]">
                  {scores.map(([name, wins], index) => (
                    <li key={name} className="flex items-center justify-between border-4 border-[#3d2614] bg-[#5f4127] p-3">
                      <span className="font-black">#{index + 1} {name}</span>
                      <span>{wins} wins</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-none border-4 border-[#3d2614] bg-[#7a5533] p-4 shadow-[8px_8px_0_rgba(0,0,0,0.35)]">
                <h2 className="mb-3 text-2xl font-black text-[#ffe7a3]">Admin</h2>
                <p className="mb-3 text-[#fff1cf] text-sm">Hidden reset still works with Shift + R pressed 3 times.</p>
                <button
                  type="button"
                  onClick={resetWholeSite}
                  className="border-4 border-[#3d2614] bg-[#b91c1c] px-4 py-2 font-black text-white shadow-[4px_4px_0_rgba(0,0,0,0.35)]"
                >
                  Reset Site
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-20 bg-[#4c8c37] border-t-8 border-[#3d2614]" />
    </div>
  );
}
