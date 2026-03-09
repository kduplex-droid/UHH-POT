function getTodayKey() {
    const today = new Date();
    return today.toISOString().split("T")[0];
}

function getDayName(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { weekday: "long" });
}

let currentDayKey = getTodayKey();

let dailyClicks = JSON.parse(localStorage.getItem("dailyClicks")) || {};
let dailyGuesses = JSON.parse(localStorage.getItem("dailyGuesses")) || {};
let dailyWinners = JSON.parse(localStorage.getItem("dailyWinners")) || {};

if (!dailyClicks[currentDayKey]) {
    dailyClicks[currentDayKey] = 0;
}

if (!dailyGuesses[currentDayKey]) {
    dailyGuesses[currentDayKey] = [];
}

function saveData() {
    localStorage.setItem("dailyClicks", JSON.stringify(dailyClicks));
    localStorage.setItem("dailyGuesses", JSON.stringify(dailyGuesses));
    localStorage.setItem("dailyWinners", JSON.stringify(dailyWinners));
}

function getCurrentGuessesLocked() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    const isAfterCutoff = hours > 9 || (hours === 9 && minutes >= 10);

    return isAfterCutoff || dailyClicks[currentDayKey] > 0;
}

function autoClosePreviousDay(dayKey) {
    const guesses = dailyGuesses[dayKey] || [];
    const actual = dailyClicks[dayKey] || 0;

    if (dailyWinners[dayKey]) {
        return;
    }

    if (guesses.length === 0) {
        dailyWinners[dayKey] = {
            name: "No guesses",
            guess: "-",
            actual: actual,
            difference: "-"
        };
        return;
    }

    let winner = guesses[0];
    let smallestDifference = Math.abs(guesses[0].guess - actual);

    for (let i = 1; i < guesses.length; i++) {
        const difference = Math.abs(guesses[i].guess - actual);

        if (difference < smallestDifference) {
            smallestDifference = difference;
            winner = guesses[i];
        }
    }

    dailyWinners[dayKey] = {
        name: winner.name,
        guess: winner.guess,
        actual: actual,
        difference: smallestDifference
    };
}

function checkForNewDay() {
    const realToday = getTodayKey();

    if (realToday !== currentDayKey) {
        autoClosePreviousDay(currentDayKey);

        currentDayKey = realToday;

        if (!dailyClicks[currentDayKey]) {
            dailyClicks[currentDayKey] = 0;
        }

        if (!dailyGuesses[currentDayKey]) {
            dailyGuesses[currentDayKey] = [];
        }

        saveData();
    }
}

function updateDisplay() {
    checkForNewDay();

    document.getElementById("dayName").textContent = getDayName(currentDayKey);
    document.getElementById("todayDate").textContent = currentDayKey;
    document.getElementById("todayCount").textContent = dailyClicks[currentDayKey];

    const guessStatus = document.getElementById("guessStatus");

    if (dailyClicks[currentDayKey] > 0) {
        guessStatus.textContent = "Guesses are locked because clicking has started";
    } else {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const isAfterCutoff = hours > 9 || (hours === 9 && minutes >= 10);

        guessStatus.textContent = isAfterCutoff
            ? "Guesses are locked after 9:10 AM"
            : "Guesses are open until 9:10 AM";
    }

    renderGuesses();
    renderDailyResults();
    renderLeaderboard();
}

function updateCountdown() {
    const countdownElement = document.getElementById("nextGuessCountdown");
    if (!countdownElement) return;

    const now = new Date();

    const nextGuessTime = new Date();
    nextGuessTime.setHours(9, 10, 0, 0);

    if (now >= nextGuessTime) {
        nextGuessTime.setDate(nextGuessTime.getDate() + 1);
    }

    const diff = nextGuessTime - now;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    countdownElement.textContent =
        `Next guess window in: ${hours}h ${minutes}m ${seconds}s`;
}

function updateDayEndCountdown() {
    const dayEndElement = document.getElementById("dayEndCountdown");
    if (!dayEndElement) return;

    const now = new Date();

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const diff = endOfDay - now;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    dayEndElement.textContent =
        `Today ends in: ${hours}h ${minutes}m ${seconds}s`;
}

function animatePot() {
    const pot = document.getElementById("pot");
    if (!pot) return;

    pot.classList.remove("pot-shake");
    void pot.offsetWidth;
    pot.classList.add("pot-shake");
}

function createCoin() {
    const potArea = document.getElementById("potArea");
    if (!potArea) return;

    const coin = document.createElement("div");
    coin.className = "coin";
    coin.textContent = "$";

    const leftPosition = Math.floor(Math.random() * 150) + 25;
    coin.style.left = leftPosition + "px";

    potArea.appendChild(coin);

    setTimeout(() => {
        coin.remove();
    }, 900);
}

function addClick() {
    checkForNewDay();

    dailyClicks[currentDayKey]++;
    saveData();
    updateDisplay();

    animatePot();
    createCoin();

    const sound = document.getElementById("clickSound");
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {});
    }

    const potButton = document.getElementById("potButton");
    if (potButton) {
        potButton.classList.remove("pot-bounce");
        void potButton.offsetWidth;
        potButton.classList.add("pot-bounce");
    }
}

function saveGuess() {
    checkForNewDay();

    if (getCurrentGuessesLocked()) {
        alert("Guesses are locked. They close at 9:10 AM or when clicking starts.");
        return;
    }

    const nameSelect = document.getElementById("playerName");
    const guessInput = document.getElementById("playerGuess");

    const name = nameSelect.value;
    const guess = parseInt(guessInput.value);

    if (!name || isNaN(guess)) {
        alert("Choose a player and enter a valid guess.");
        return;
    }

    const alreadyGuessed = dailyGuesses[currentDayKey].some(entry => entry.name === name);

    if (alreadyGuessed) {
        alert(name + " has already made a guess for today.");
        return;
    }

    dailyGuesses[currentDayKey].push({
        name: name,
        guess: guess
    });

    guessInput.value = "";
    saveData();
    updateDisplay();
}

function renderGuesses() {
    const guessList = document.getElementById("guessList");
    guessList.innerHTML = "";

    const guesses = dailyGuesses[currentDayKey] || [];

    if (guesses.length === 0) {
        guessList.innerHTML = "<li>No guesses yet</li>";
        return;
    }

    guesses.forEach(entry => {
        const li = document.createElement("li");
        li.textContent = `${entry.name} guessed ${entry.guess}`;
        guessList.appendChild(li);
    });
}

function renderDailyResults() {
    const dailyResults = document.getElementById("dailyResults");
    dailyResults.innerHTML = "";

    const dates = Object.keys(dailyWinners).sort().reverse();

    if (dates.length === 0) {
        dailyResults.innerHTML = "<li>No completed results yet</li>";
        return;
    }

    dates.forEach(date => {
        const result = dailyWinners[date];
        const li = document.createElement("li");
        li.textContent = `${getDayName(date)} (${date}) — Winner: ${result.name}, Guess: ${result.guess}, Actual: ${result.actual}`;
        dailyResults.appendChild(li);
    });
}

function renderLeaderboard() {
    const leaderboard = document.getElementById("leaderboard");
    leaderboard.innerHTML = "";

    const scores = {
        William: 0,
        Rylan: 0,
        Nickeel: 0,
        Kgothatso: 0
    };

    const results = Object.values(dailyWinners);

    results.forEach(result => {
        if (scores.hasOwnProperty(result.name)) {
            scores[result.name]++;
        }
    });

    const sortedPlayers = Object.entries(scores).sort((a, b) => b[1] - a[1]);

    sortedPlayers.forEach(player => {
        const li = document.createElement("li");
        li.textContent = `${player[0]} — ${player[1]} wins`;
        leaderboard.appendChild(li);
    });
}

function openResetPrompt() {
    const password = prompt("Enter admin code:");

    if (password === "UHH2026RESET") {
        const confirmReset = confirm("Reset the whole site? This will delete all saved data.");

        if (confirmReset) {
            resetWholeSite();
        }
    } else if (password !== null) {
        alert("Wrong admin code.");
    }
}

function resetWholeSite() {
    localStorage.removeItem("dailyClicks");
    localStorage.removeItem("dailyGuesses");
    localStorage.removeItem("dailyWinners");

    dailyClicks = {};
    dailyGuesses = {};
    dailyWinners = {};

    currentDayKey = getTodayKey();

    dailyClicks[currentDayKey] = 0;
    dailyGuesses[currentDayKey] = [];

    saveData();
    updateDisplay();
    updateCountdown();
    updateDayEndCountdown();

    alert("The whole site has been reset.");
}

let resetKeyCount = 0;
let lastResetKeyTime = 0;

document.addEventListener("keydown", function(event) {
    const now = Date.now();

    if (event.shiftKey && event.key.toLowerCase() === "r") {
        if (now - lastResetKeyTime > 2000) {
            resetKeyCount = 0;
        }

        resetKeyCount++;
        lastResetKeyTime = now;

        if (resetKeyCount === 3) {
            resetKeyCount = 0;
            openResetPrompt();
        }
    }
});

updateDisplay();
updateCountdown();
updateDayEndCountdown();

setInterval(updateDisplay, 60000);
setInterval(updateCountdown, 1000);
setInterval(updateDayEndCountdown, 1000);
