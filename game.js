const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Vidas y puntuación
let lives = 3;
let score = 0;
let invulnerable = false;

// Jugador (rata)
let rata = {
  x: 50,
  y: 300,
  width: 40,
  height: 40,
  dy: 0,
  gravedad: 0.6,
  salto: -10
};

// Obstáculos
let obstacles = [
  { type: "moving", x: 800, y: 300, width: 30, height: 50, speed: 5 },
  { type: "static", x: 1200, y: 300, width: 30, height: 50, speed: 3 }
];

// Control
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    rata.dy = rata.salto;
  }
});

// Dibujar obstáculos
function drawObstacles() {
  obstacles.forEach(ob => {
    ctx.fillStyle = ob.type === "moving" ? "red" : "blue";
    ctx.fillRect(ob.x, ob.y, ob.width, ob.height);
  });
}

// Mover obstáculos + puntuación
function updateObstacles() {
  obstacles.forEach(ob => {
    ob.x -= ob.speed;

    if (ob.x < -50) {
      ob.x = canvas.width + Math.random() * 300;
      score += 10;
    }
  });
}

// Colisiones
function checkCollision() {
  obstacles.forEach(ob => {
    if (
      rata.x < ob.x + ob.width &&
      rata.x + rata.width > ob.x &&
      rata.y < ob.y + ob.height &&
      rata.y + rata.height > ob.y
    ) {
      crash();
    }
  });
}

// Daño
function crash() {
  if (invulnerable) return;

  invulnerable = true;
  lives--;

  setTimeout(() => {
    invulnerable = false;
  }, 1000);

  if (lives <= 0) {
    alert("Game Over 🐀💀");
    location.reload();
  }
}

// Actualizar
function update() {
  // Gravedad
  rata.dy += rata.gravedad;
  rata.y += rata.dy;

  // Piso
  if (rata.y > 300) {
    rata.y = 300;
    rata.dy = 0;
  }

  // Techo
  if (rata.y < 0) {
    rata.y = 0;
    rata.dy = 0;
  }

  updateObstacles();
  checkCollision();
}

// Dibujar
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Rata
  ctx.fillStyle = invulnerable ? "orange" : "gray";
  ctx.fillRect(rata.x, rata.y, rata.width, rata.height);

  // Obstáculos
  drawObstacles();

  // UI
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("Vidas: " + lives, 10, 30);
  ctx.fillText("Puntos: " + score, 650, 30);
}

// Loop
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();