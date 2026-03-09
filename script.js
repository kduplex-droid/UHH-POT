function getTodayKey() {
    return new Date().toISOString().split("T")[0];
}

function getDayName(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", { weekday: "long" });
}

function getWeekStartKey(dateString) {
    const date = new Date(dateString + "T00:00:00");
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    return date.toISOString().split("T")[0];
}

function getMonthKey(dateString) {
    return dateString.slice(0, 7);
}

const PLAYER_NAMES = ["William", "Rylan", "Nickeel", "Kgothatso"];
const CONTRIBUTION_PER_PLAYER = 2;
const PLAYER_COUNT = 4;
const WEEK_LENGTH_DAYS = 5;

let currentDayKey = getTodayKey();

let dailyClicks = JSON.parse(localStorage.getItem("dailyClicks")) || {};
let dailyGuesses = JSON.parse(localStorage.getItem("dailyGuesses")) || {};
let dailyWinners = JSON.parse(localStorage.getItem("dailyWinners")) || {};
let playerPasswords = JSON.parse(localStorage.getItem("playerPasswords")) || {};

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

function savePasswords() {
    localStorage.setItem("playerPasswords", JSON.stringify(playerPasswords));
}

function hasPassword(playerName) {
    return !!playerPasswords[playerName];
}

function setPlayerPassword(playerName, newPassword) {
    playerPasswords[playerName] = newPassword;
    savePasswords();
}

function verifyPlayerPassword(playerName, password) {
    return playerPasswords[playerName] === password;
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

function selectCharacter(name) {
    document.querySelectorAll(".player-card").forEach(card => {
        card.classList.remove("player-selected");
    });

    const selectedCard = document.getElementById("player-" + name);
    if (selectedCard) {
        selectedCard.classList.add("player-selected");
    }

    const playerSelect = document.getElementById("playerName");
    if (playerSelect) {
        playerSelect.value = name;
    }
}

function clearCrowns() {
    document.querySelectorAll(".crown").forEach(crown => {
        crown.classList.remove("crown-show");
    });
}

function updateWinnerHighlight() {
    document.querySelectorAll(".player-card").forEach(card => {
        card.classList.remove("winner-highlight");
    });

    clearCrowns();

    const todayWinner = dailyWinners[currentDayKey];

    if (todayWinner && todayWinner.name && todayWinner.name !== "No guesses") {
        const winnerCard = document.getElementById("player-" + todayWinner.name);
        const winnerCrown = document.getElementById("crown-" + todayWinner.name);

        if (winnerCard) {
            winnerCard.classList.add("winner-highlight");
        }

        if (winnerCrown) {
            winnerCrown.classList.add("crown-show");
        }
    }
}

function makeScoreObject() {
    return {
        William: 0,
        Rylan: 0,
        Nickeel: 0,
        Kgothatso: 0
    };
}

function sortScores(scores) {
    return Object.entries(scores).sort((a, b) => b[1] - a[1]);
}

function getAllTimeScores() {
    const scores = makeScoreObject();

    Object.values(dailyWinners).forEach(result => {
        if (scores.hasOwnProperty(result.name)) {
            scores[result.name]++;
        }
    });

    return scores;
}

function getCurrentWeekScores() {
    const scores = makeScoreObject();
    const currentWeekStart = getWeekStartKey(currentDayKey);

    Object.entries(dailyWinners).forEach(([date, result]) => {
        if (getWeekStartKey(date) === currentWeekStart && scores.hasOwnProperty(result.name)) {
            scores[result.name]++;
        }
    });

    return scores;
}

function getCurrentMonthScores() {
    const scores = makeScoreObject();
    const currentMonth = getMonthKey(currentDayKey);

    Object.entries(dailyWinners).forEach(([date, result]) => {
        if (getMonthKey(date) === currentMonth && scores.hasOwnProperty(result.name)) {
            scores[result.name]++;
        }
    });

    return scores;
}

function getMonthlyGameDaysCount() {
    const currentMonth = getMonthKey(currentDayKey);
    const uniqueDays = new Set();

    Object.keys(dailyWinners).forEach(date => {
        if (getMonthKey(date) === currentMonth) {
            uniqueDays.add(date);
        }
    });

    if (
        (dailyGuesses[currentDayKey] && dailyGuesses[currentDayKey].length > 0) ||
        (dailyClicks[currentDayKey] && dailyClicks[currentDayKey] > 0)
    ) {
        uniqueDays.add(currentDayKey);
    }

    return uniqueDays.size;
}

function updatePotTracker() {
    const dailyPot = CONTRIBUTION_PER_PLAYER * PLAYER_COUNT;
    const weeklyPot = dailyPot * WEEK_LENGTH_DAYS;
    const monthlyDays = getMonthlyGameDaysCount();
    const monthlyPot = dailyPot * monthlyDays;

    const monthlyScores = getCurrentMonthScores();
    const sortedMonthly = sortScores(monthlyScores);
    const monthlyLeader = sortedMonthly[0];
    const monthlyWinnerName = monthlyLeader && monthlyLeader[1] > 0 ? monthlyLeader[0] : "-";

    document.getElementById("dailyPot").textContent = `R${dailyPot}`;
    document.getElementById("weeklyPot").textContent = `R${weeklyPot}`;
    document.getElementById("monthlyPot").textContent = `R${monthlyPot}`;
    document.getElementById("monthlyLeader").textContent =
        monthlyLeader ? `${monthlyLeader[0]} (${monthlyLeader[1]} wins)` : "-";
    document.getElementById("monthlyWinner").textContent = monthlyWinnerName;
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
    renderWeeklyLeaderboard();
    renderMonthlyLeaderboard();
    updatePotTracker();
    updateWinnerHighlight();
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

    countdownElement.textContent = `Next guess window in: ${hours}h ${minutes}m ${seconds}s`;
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

    dayEndElement.textContent = `Today ends in: ${hours}h ${minutes}m ${seconds}s`;
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
    coin.textContent = "🪙";

    const leftPosition = Math.floor(Math.random() * 150) + 40;
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

function reportMisclicks() {
    checkForNewDay();

    const misclickInput = document.getElementById("misclickAmount");
    const misclicks = parseInt(misclickInput.value, 10);

    if (isNaN(misclicks) || misclicks <= 0) {
        alert("Enter a valid number of misclicks.");
        return;
    }

    if (misclicks > dailyClicks[currentDayKey]) {
        alert("Misclicks cannot be more than today's clicks.");
        return;
    }

    dailyClicks[currentDayKey] -= misclicks;
    saveData();
    updateDisplay();

    misclickInput.value = "";
    alert(misclicks + " misclick(s) removed.");
}

function saveGuess() {
    checkForNewDay();

    if (getCurrentGuessesLocked()) {
        alert("Guesses are locked. They close at 9:10 AM or when clicking starts.");
        return;
    }

    const nameSelect = document.getElementById("playerName");
    const guessInput = document.getElementById("playerGuess");
    const passwordInput = document.getElementById("playerPassword");
    const newPasswordInput = document.getElementById("newPlayerPassword");

    const name = nameSelect.value;
    const guess = parseInt(guessInput.value, 10);
    const password = passwordInput.value.trim();
    const newPassword = newPasswordInput.value.trim();

    selectCharacter(name);

    if (!name || isNaN(guess)) {
        alert("Choose a player and enter a valid guess.");
        return;
    }

    const alreadyGuessed = dailyGuesses[currentDayKey].some(entry => entry.name === name);

    if (alreadyGuessed) {
        alert(name + " has already made a guess for today.");
        return;
    }

    if (!hasPassword(name)) {
        if (newPassword.length < 4) {
            alert("First-time setup: create a password with at least 4 characters.");
            return;
        }

        setPlayerPassword(name, newPassword);
        alert("Password created for " + name + ".");
    } else {
        if (!verifyPlayerPassword(name, password)) {
            alert("Incorrect password for " + name + ".");
            return;
        }
    }

    dailyGuesses[currentDayKey].push({
        name: name,
        guess: guess
    });

    guessInput.value = "";
    passwordInput.value = "";
    newPasswordInput.value = "";

    saveData();
    updateDisplay();
}

function requestPasswordChange() {
    const nameSelect = document.getElementById("playerName");
    const passwordInput = document.getElementById("playerPassword");
    const newPasswordInput = document.getElementById("newPlayerPassword");

    const name = nameSelect.value;
    const currentPassword = passwordInput.value.trim();
    const newPassword = newPasswordInput.value.trim();

    if (!name) {
        alert("Choose a player first.");
        return;
    }

    if (!hasPassword(name)) {
        if (newPassword.length < 4) {
            alert("Create a password with at least 4 characters.");
            return;
        }

        setPlayerPassword(name, newPassword);
        passwordInput.value = "";
        newPasswordInput.value = "";
        alert("Password created for " + name + ".");
        return;
    }

    if (!verifyPlayerPassword(name, currentPassword)) {
        alert("Incorrect current password for " + name + ".");
        return;
    }

    if (newPassword.length < 4) {
        alert("New password must be at least 4 characters.");
        return;
    }

    setPlayerPassword(name, newPassword);

    passwordInput.value = "";
    newPasswordInput.value = "";

    alert("Password changed for " + name + ".");
}

function adminResetPlayerPassword() {
    const nameSelect = document.getElementById("playerName");
    const passwordInput = document.getElementById("playerPassword");
    const newPasswordInput = document.getElementById("newPlayerPassword");

    const name = nameSelect.value;

    if (!name) {
        alert("Choose a player first.");
        return;
    }

    const adminCode = prompt("Enter admin code to reset this player's password:");

    if (adminCode !== "UHH2026RESET") {
        if (adminCode !== null) {
            alert("Wrong admin code.");
        }
        return;
    }

    const confirmReset = confirm("Reset password for " + name + "?");
    if (!confirmReset) {
        return;
    }

    delete playerPasswords[name];
    savePasswords();

    passwordInput.value = "";
    newPasswordInput.value = "";

    alert("Password reset for " + name + ". They can now create a new one.");
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

    sortScores(getAllTimeScores()).forEach(player => {
        const li = document.createElement("li");
        li.textContent = `${player[0]} — ${player[1]} wins`;
        leaderboard.appendChild(li);
    });
}

function renderWeeklyLeaderboard() {
    const leaderboard = document.getElementById("weeklyLeaderboard");
    leaderboard.innerHTML = "";

    sortScores(getCurrentWeekScores()).forEach(player => {
        const li = document.createElement("li");
        li.textContent = `${player[0]} — ${player[1]} wins`;
        leaderboard.appendChild(li);
    });
}

function renderMonthlyLeaderboard() {
    const leaderboard = document.getElementById("monthlyLeaderboard");
    leaderboard.innerHTML = "";

    sortScores(getCurrentMonthScores()).forEach(player => {
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

    const misclickInput = document.getElementById("misclickAmount");
    if (misclickInput) {
        misclickInput.value = "";
    }

    alert("The whole site has been reset.");
}

function toggleMenu() {
    const menu = document.getElementById("menuDropdown");
    if (menu) {
        menu.classList.toggle("show");
    }
}

let resetKeyCount = 0;
let lastResetKeyTime = 0;

document.addEventListener("keydown", function (event) {
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

document.addEventListener("click", function (event) {
    const menu = document.getElementById("menuDropdown");
    const button = document.querySelector(".menu-button");

    if (!menu || !button) return;

    if (!menu.contains(event.target) && !button.contains(event.target)) {
        menu.classList.remove("show");
    }
});

document.getElementById("playerName").addEventListener("change", function () {
    const passwordInput = document.getElementById("playerPassword");
    const newPasswordInput = document.getElementById("newPlayerPassword");

    if (this.value) {
        selectCharacter(this.value);
    }

    if (!this.value) {
        passwordInput.placeholder = "Enter current password";
        newPasswordInput.placeholder = "Create or change password";
        return;
    }

    if (hasPassword(this.value)) {
        passwordInput.placeholder = "Enter current password";
        newPasswordInput.placeholder = "Enter new password to change it";
    } else {
        passwordInput.placeholder = "No password yet";
        newPasswordInput.placeholder = "Create your password";
    }
});

updateDisplay();
updateCountdown();
updateDayEndCountdown();

setInterval(updateDisplay, 60000);
setInterval(updateCountdown, 1000);
setInterval(updateDayEndCountdown, 1000);
