window.gameState = "menu";

const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("startBtn");

function startGame() {
  window.gameState = "play";
  overlay.style.display = "none";
  if (window.resetTime) window.resetTime();
}

startBtn.addEventListener("click", startGame);

window.addEventListener("keydown", (e) => {
  if (window.gameState === "menu" && e.key === "Enter") {
    startGame();
  }
});
