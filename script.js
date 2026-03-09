let clicks = localStorage.getItem("potClicks");

if (clicks === null) {
    clicks = 0;
} else {
    clicks = parseInt(clicks);
}

document.getElementById("counter").innerText = clicks;

function addClick() {
    clicks++;
    document.getElementById("counter").innerText = clicks;
    localStorage.setItem("potClicks", clicks);
}

function resetCount() {
    clicks = 0;
    document.getElementById("counter").innerText = clicks;
    localStorage.setItem("potClicks", clicks);
}
