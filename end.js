const score = localStorage.getItem("score") || 0;
document.getElementById("finalScore").textContent =
  `Your score: ${score}`;

document.getElementById("restartBtn").addEventListener("click", () => {
  localStorage.removeItem("score");
  window.location.href = "index.html";
});
