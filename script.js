// Variables to control game state
let gameRunning = false; // Keeps track of whether game is active or not
let dropMaker; // Will store our timer that creates drops regularly

// Game state variables
let score = 0;
let time = 30;
let timerInterval = null;
let gameActive = false;

// DOM elements
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const startBtn = document.getElementById('start-btn');
const gameContainer = document.getElementById("game-container");
const bucket = document.getElementById("bucket");

// Wait for button click to start the game
document.getElementById("start-btn").addEventListener("click", startGame);

function startGame() {
  // Prevent multiple games from running at once
  if (gameRunning) return;

  gameRunning = true;
  updateScore(0);
  updateTime(30);
  startBtn.disabled = true;

  // Create new drops every second (1000 milliseconds)
  dropMaker = setInterval(createDrop, 1000);

  timerInterval = setInterval(() => {
    if (time > 0) {
      updateTime(time - 1);
    } else {
      endGame();
    }
  }, 1000);
}

function createDrop() {
  const drop = document.createElement("div");
  drop.className = "water-drop";

  const initialSize = 60;
  const sizeMultiplier = Math.random() * 0.8 + 0.5;
  const size = initialSize * sizeMultiplier;
  drop.style.width = drop.style.height = `${size}px`;

  const gameWidth = gameContainer.offsetWidth;
  const xPosition = Math.random() * (gameWidth - 60);
  drop.style.left = xPosition + "px";
  drop.style.animationDuration = "4s";

  gameContainer.appendChild(drop);

  // Check for catch on each animation frame
  let caught = false;
  function checkCatch() {
    if (!gameRunning || caught) return;
    const dropRect = drop.getBoundingClientRect();
    const bucketRect = bucket.getBoundingClientRect();
    // If drop bottom touches bucket top and horizontally overlaps
    if (
      dropRect.bottom >= bucketRect.top &&
      dropRect.left < bucketRect.right &&
      dropRect.right > bucketRect.left
    ) {
      caught = true;
      drop.remove();
      updateScore(score + 1);
    } else if (dropRect.top < gameContainer.getBoundingClientRect().bottom) {
      requestAnimationFrame(checkCatch);
    }
  }
  requestAnimationFrame(checkCatch);

  drop.addEventListener("animationend", () => {
    drop.remove();
  });
}

// Update score display
function updateScore(val) {
    score = val;
    scoreEl.textContent = score;
}

// Update time display
function updateTime(val) {
    time = val;
    timeEl.textContent = time;
}

// End game logic
function endGame() {
    gameRunning = false;
    gameActive = false;
    clearInterval(timerInterval);
    clearInterval(dropMaker);
    startBtn.disabled = false;
    alert(`Game Over! Your score: ${score}`);
}

// Move bucket with mouse/touch
gameContainer.addEventListener("mousemove", (e) => {
    const rect = gameContainer.getBoundingClientRect();
    let x = e.clientX - rect.left - bucket.offsetWidth / 2;
    x = Math.max(0, Math.min(x, gameContainer.offsetWidth - bucket.offsetWidth));
    bucket.style.left = x + "px";
});

// Touch support
gameContainer.addEventListener("touchmove", (e) => {
    if (e.touches.length > 0) {
        const rect = gameContainer.getBoundingClientRect();
        let x = e.touches[0].clientX - rect.left - bucket.offsetWidth / 2;
        x = Math.max(0, Math.min(x, gameContainer.offsetWidth - bucket.offsetWidth));
        bucket.style.left = x + "px";
    }
});
