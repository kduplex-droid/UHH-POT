function getTodayKey() {
    const today = new Date();
    return today.toISOString().split("T")[0];
}

const todayKey = getTodayKey();

let dailyClicks = JSON.parse(localStorage.getItem("dailyClicks")) || {};
let dailyGuesses = JSON.parse(localStorage.getItem("dailyGuesses")) || {};
let dailyWinners = JSON.parse(localStorage.getItem("dailyWinners")) || {};

if (!dailyClicks[todayKey]) {
    dailyClicks[todayKey] = 0;
}

if (!dailyGuesses[todayKey]) {
    dailyGuesses[todayKey] = [];
}

document.getElementById("todayDate").textContent = todayKey;

function saveData() {
    localStorage.setItem("dailyClicks", JSON.stringify(dailyClicks));
    localStorage.setItem("dailyGuesses", JSON.stringify(dailyGuesses));
    localStorage.setItem("dailyWinners", JSON.stringify(dailyWinners));
}

function updateDisplay() {
    document.getElementById("todayCount").textContent = dailyClicks[todayKey];
    document.getElementById("actualClicks").textContent = dailyClicks[todayKey];

    renderGuesses();
    renderDailyResults();

    if (dailyWinners[todayKey]) {
        document.getElementById("winnerDisplay").textContent =
            `${dailyWinners[todayKey].name} with guess ${dailyWinners[todayKey].guess}`;
    } else {
        document.getElementById("winnerDisplay").textContent = "No winner yet";
    }
}

function addClick() {
    dailyClicks[todayKey]++;
    saveData();
    updateDisplay();
}

function resetToday() {
    dailyClicks[todayKey] = 0;
    delete dailyWinners[todayKey];
    saveData();
    updateDisplay();
}

function saveGuess() {
    const nameInput = document.getElementById("playerName");
    const guessInput = document.getElementById("playerGuess");

    const name = nameInput.value.trim();
    const guess = parseInt(guessInput.value);

    if (name === "" || isNaN(guess)) {
        alert("Enter a name and a valid guess.");
        return;
    }

    dailyGuesses[todayKey].push({
        name: name,
        guess: guess
    });

    nameInput.value = "";
    guessInput.value = "";

    saveData();
    updateDisplay();
}

function renderGuesses() {
    const guessList = document.getElementById("guessList");
    guessList.innerHTML = "";

    if (dailyGuesses[todayKey].length === 0) {
        guessList.innerHTML = "<li>No guesses yet</li>";
        return;
    }

    dailyGuesses[todayKey].forEach(entry => {
        const li = document.createElement("li");
        li.textContent = `${entry.name} guessed ${entry.guess}`;
        guessList.appendChild(li);
    });
}

function calculateWinner() {
    const actual = dailyClicks[todayKey];
    const guesses = dailyGuesses[todayKey];

    if (!guesses || guesses.length === 0) {
        alert("No guesses entered for today.");
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

    dailyWinners[todayKey] = {
        name: winner.name,
        guess: winner.guess,
        actual: actual,
        difference: smallestDifference
    };

    saveData();
    updateDisplay();
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
        li.textContent =
            `${date} — Winner: ${result.name}, Guess: ${result.guess}, Actual: ${result.actual}`;
        dailyResults.appendChild(li);
    });
}

updateDisplay();
