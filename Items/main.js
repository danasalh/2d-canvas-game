if (!window.gameState) window.gameState = "menu";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const SPRITE_W = 32;
const SPRITE_H = 32;
const SCALE = 2;
const BOMB_SCALE = 1.2;



let frame = 0;
let fps = 10;
let last = 0;
let acc = 0;

let score = 0;
let lives = 3;

const player = {
  x: 100,
  y: 0,
  vx: 0,
  speed: 4,
  facing: "right",
};

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;

  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  player.y = h - SPRITE_H * SCALE - 10;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const playerImg = new Image();
playerImg.src = "MainCharacters/PinkMan/idle.png";

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const FRUIT_SOURCES = [
  "Items/Fruits/Apple.png",
  "Items/Fruits/Bananas.png",
  "Items/Fruits/Cherries.png",
  "Items/Fruits/Kiwi.png",
  "Items/Fruits/Melon.png",
  "Items/Fruits/Orange.png",
  "Items/Fruits/Pineapple.png",
  "Items/Fruits/Strawberry.png",
];

let fruitImages = [];
Promise.all(FRUIT_SOURCES.map(loadImage)).then(imgs => fruitImages = imgs);


const FRUIT_W = 32;
const FRUIT_H = 32;

const objects = [];
let fruitTimer = 0;
let bombTimer = 0;

function spawnFruit() {
  if (!fruitImages.length) return;
  const w = canvas.clientWidth || window.innerWidth;
  const img = fruitImages[Math.floor(Math.random() * fruitImages.length)];
  const frames = Math.max(1, Math.floor(img.naturalWidth / FRUIT_W));

  objects.push({
    type: "fruit",
    img,
    x: Math.random() * (w - FRUIT_W * SCALE),
    y: -FRUIT_H * SCALE,
    vy: 2,
    frame: 0,
    frames,
    acc: 0,
  });
}

function spawnBomb() {
  const w = canvas.clientWidth || window.innerWidth;

  objects.push({
    type: "bomb",
    x: Math.random() * (w - 30),
    y: -30,
    vy: 3
  });
}

function rectHit(a, b) {
  return !(
    a.x + a.w < b.x ||
    a.x > b.x + b.w ||
    a.y + a.h < b.y ||
    a.y > b.y + b.h
  );
}

function updateObjects(dt) {
  const h = canvas.clientHeight || window.innerHeight;

  fruitTimer += dt;
  if (fruitTimer > 900) {
    fruitTimer = 0;
    spawnFruit();
  }

  bombTimer += dt;
  if (bombTimer > 800) {
    bombTimer = 0;
    spawnBomb();
  }

  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i];
    o.y += o.vy;

    if (o.type === "fruit") {
      o.acc += dt;
      if (o.acc > 120) {
        o.frame = (o.frame + 1) % o.frames;
        o.acc = 0;
      }
    }

    const oRect = o.type === "bomb"
      ? { x: o.x - 14, y: o.y - 14, w: 28, h: 28 }
      : { x: o.x, y: o.y, w: FRUIT_W * SCALE, h: FRUIT_H * SCALE };

    const pRect = {
      x: player.x,
      y: player.y,
      w: SPRITE_W * SCALE,
      h: SPRITE_H * SCALE
    };

    if (rectHit(oRect, pRect)) {
      if (o.type === "bomb") {
        lives--;

        if (lives <= 0) {
          // GAME OVER
          window.gameState = "menu";

          const endOverlay = document.getElementById("endOverlay");
          const finalScore = document.getElementById("finalScore");
          const restartBtn = document.getElementById("restartBtn");

          finalScore.textContent = `Score: ${score}`;
          endOverlay.style.display = "grid";

          restartBtn.onclick = () => {
            score = 0;
            lives = 3;
            objects.length = 0;
            fruitTimer = 0;
            bombTimer = 0;

            endOverlay.style.display = "none";

            const overlay = document.getElementById("overlay");
            overlay.style.display = "grid";
          };

          return; 
        }

      } else {
        score++;
      }

      objects.splice(i, 1);
      continue;
    }

    if (o.y > h + 50) {
      objects.splice(i, 1);
    }
  }
}


function drawObjects() {
  for (const o of objects) {
    if (o.type === "bomb") {
      ctx.font = "28px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("💣", o.x, o.y);
    } else {
      ctx.drawImage(
        o.img,
        o.frame * FRUIT_W,
        0,
        FRUIT_W,
        FRUIT_H,
        o.x,
        o.y,
        FRUIT_W * SCALE,
        FRUIT_H * SCALE
      );
    }
  }
}


const keys = new Set();
window.addEventListener("keydown", e => keys.add(e.key));
window.addEventListener("keyup", e => keys.delete(e.key));

function updatePlayer() {
  player.vx = 0;
  if (keys.has("ArrowLeft")) {
    player.vx = -player.speed;
    player.facing = "left";
  }
  if (keys.has("ArrowRight")) {
    player.vx = player.speed;
    player.facing = "right";
  }
  player.x += player.vx;

  const w = canvas.clientWidth || window.innerWidth;
  player.x = Math.max(0, Math.min(player.x, w - SPRITE_W * SCALE));
}

function drawPlayer() {
  const sx = frame * SPRITE_W;
  const dw = SPRITE_W * SCALE;
  const dh = SPRITE_H * SCALE;

  ctx.save();
  if (player.facing === "left") {
    ctx.translate(player.x + dw, player.y);
    ctx.scale(-1, 1);
    ctx.drawImage(playerImg, sx, 0, SPRITE_W, SPRITE_H, 0, 0, dw, dh);
  } else {
    ctx.drawImage(playerImg, sx, 0, SPRITE_W, SPRITE_H, player.x, player.y, dw, dh);
  }
  ctx.restore();
}

function drawUI() {
  ctx.fillStyle = "#7a1c4b";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 20, 30);
  ctx.fillText(`❤️ ${lives}`, 20, 60);
}
function drawBackground() {
  const w = canvas.width;
  const h = canvas.height;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#ffe0ec");
  grad.addColorStop(0.5, "#f8bbd0");
  grad.addColorStop(1, "#e1bee7");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

 
  for (let i = 0; i < 20; i++) {
    const x = (Math.sin(performance.now() / 1000 + i) + 1) * w / 2;
    const y = (i / 20) * h;

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fill();
  }
}


function loop(ts) {
  const dt = ts - last;
  last = ts;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

                          //   drawBackground();

 

  if (window.gameState !== "play") {
    requestAnimationFrame(loop);
    return;
  }

  updatePlayer();
  updateObjects(dt);
  drawObjects();

  acc += dt;
  if (acc > 1000 / fps) {
    frame = (frame + 1) % Math.max(1, Math.floor(playerImg.naturalWidth / SPRITE_W));
    acc = 0;
  }

  drawPlayer();
  drawUI();

  requestAnimationFrame(loop);
}

window.loop = loop;
window.resetTime = () => {
  last = performance.now();
  acc = 0;
};

playerImg.onload = () => requestAnimationFrame(loop);
