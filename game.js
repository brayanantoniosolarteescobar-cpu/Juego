const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function crearSonido(frecuencia, duracion) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);
    osc.frequency.value = frecuencia;
    osc.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duracion);
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + duracion);
}

const sonidos = {
    salto: () => crearSonido(400, 0.1),
    colision: () => crearSonido(100, 0.2),
    punto: () => crearSonido(800, 0.1),
    powerUp: () => crearSonido(600, 0.3)
};

let rata = {
    x: 50,
    y: 300,
    width: 40,
    height: 40,
    dy: 0,
    gravedad: 0.6,
    salto: -10,
    puedesSaltar: true
};

let score = 0;
let gameOver = false;
let vidas = 3;
let velocidadObs = 5;
let dificultad = 0;
let powerUpActivo = false;
let powerUpTiempo = 0;
let obstaculos = [];
let powerUps = [];

const tiposObstaculos = [
    { nombre: 'normal', color: 'red', width: 30, height: 50, puntos: 10 },
    { nombre: 'grande', color: 'darkred', width: 50, height: 50, puntos: 20 },
    { nombre: 'espinas', color: 'darkred', width: 30, height: 70, puntos: 15 }
];

function crearObstaculo() {
    if (!gameOver) {
        const tipo = tiposObstaculos[Math.floor(Math.random() * tiposObstaculos.length)];
        obstaculos.push({
            x: canvas.width,
            y: 320,
            width: tipo.width,
            height: tipo.height,
            tipo: tipo.nombre,
            color: tipo.color,
            puntos: tipo.puntos
        });
    }
}

function crearPowerUp() {
    if (!gameOver && Math.random() < 0.1) {
        powerUps.push({
            x: canvas.width,
            y: 280,
            width: 25,
            height: 25,
            tipo: 'escudo'
        });
    }
}

document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        e.preventDefault();
        if (rata.puedesSaltar && !gameOver) {
            rata.dy = rata.salto;
            rata.puedesSaltar = false;
            sonidos.salto();
        }
    }
});

document.addEventListener("keydown", (e) => {
    if (e.code === "KeyR" && gameOver) {
        location.reload();
    }
});

function actualizar() {
    if (gameOver) return;
    rata.dy += rata.gravedad;
    rata.y += rata.dy;
    if (rata.y >= 300) {
        rata.y = 300;
        rata.dy = 0;
        rata.puedesSaltar = true;
    }

    if (powerUpActivo) {
        powerUpTiempo--;
        if (powerUpTiempo <= 0) {
            powerUpActivo = false;
        }
    }

    for (let i = obstaculos.length - 1; i >= 0; i--) {
        obstaculos[i].x -= velocidadObs;
        if (obstaculos[i].x + obstaculos[i].width < 0) {
            obstaculos.splice(i, 1);
            score += obstaculos[i]?.puntos || 10;
            sonidos.punto();
            if (score % 100 === 0) {
                velocidadObs = Math.min(velocidadObs + 1, 12);
            }
        }
    }

    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].x -= velocidadObs;
        if (powerUps[i].x + powerUps[i].width < 0) {
            powerUps.splice(i, 1);
        }
    }

    for (let obs of obstaculos) {
        if (rata.x < obs.x + obs.width && rata.x + rata.width > obs.x && rata.y < obs.y + obs.height && rata.y + rata.height > obs.y) {
            if (powerUpActivo) {
                powerUpActivo = false;
                obstaculos = obstaculos.filter(o => o !== obs);
                sonidos.colision();
            } else {
                vidas--;
                sonidos.colision();
                if (vidas <= 0) {
                    gameOver = true;
                } else {
                    rata.y = 300;
                    rata.dy = 0;
                }
            }
        }
    }

    for (let i = powerUps.length - 1; i >= 0; i--) {
        let pu = powerUps[i];
        if (rata.x < pu.x + pu.width && rata.x + rata.width > pu.x && rata.y < pu.y + pu.height && rata.y + rata.height > pu.y) {
            powerUpActivo = true;
            powerUpTiempo = 300;
            sonidos.powerUp();
            powerUps.splice(i, 1);
        }
    }
}

function dibujar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const gradiente = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradiente.addColorStop(0, '#87CEEB');
    gradiente.addColorStop(1, '#E0F6FF');

    ctx.fillStyle = gradiente;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#228B22";
    ctx.fillRect(0, 340, canvas.width, 60);
    ctx.strokeStyle = "#1a6b1a";
    ctx.lineWidth = 2;

    for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 340);
        ctx.lineTo(i + 20, 360);
        ctx.stroke();
    }

    ctx.fillStyle = powerUpActivo ? "gold" : "gray";
    ctx.fillRect(rata.x, rata.y, rata.width, rata.height);
    ctx.fillStyle = "black";
    ctx.fillRect(rata.x + 10, rata.y + 10, 5, 5);
    ctx.fillRect(rata.x + 25, rata.y + 10, 5, 5);

    if (powerUpActivo) {
        ctx.strokeStyle = "gold";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(rata.x + rata.width / 2, rata.y + rata.height / 2, 30, 0, Math.PI * 2);
        ctx.stroke();
    }

    obstaculos.forEach((obs) => {
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        if (obs.tipo === 'espinas') {
            ctx.fillStyle = "darkred";
            for (let i = 0; i < obs.width; i += 10) {
                ctx.beginPath();
                ctx.moveTo(obs.x + i, obs.y);
                ctx.lineTo(obs.x + i + 5, obs.y - 10);
                ctx.lineTo(obs.x + i + 10, obs.y);
                ctx.fill();
            }
        }
    });

    powerUps.forEach((pu) => {
        ctx.fillStyle = "gold";
        ctx.beginPath();
        ctx.arc(pu.x + pu.width / 2, pu.y + pu.height / 2, pu.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "orange";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⭐", pu.x + pu.width / 2, pu.y + pu.height / 2);
    });

    ctx.fillStyle = "black";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Puntuación: ${score}`, 10, 30);
    ctx.fillText(`Vidas: ❤️ ${vidas}`, 10, 60);
    ctx.fillText(`Velocidad: ${velocidadObs}`, canvas.width - 200, 30);

    if (powerUpActivo) {
        ctx.fillStyle = "gold";
        ctx.fillText(`🛡️ Escudo: ${Math.ceil(powerUpTiempo / 60)}s`, canvas.width - 200, 60);
    }

    if (gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "bold 50px Arial";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 60);
        ctx.font = "30px Arial";
        ctx.fillText(`Puntuación Final: ${score}`, canvas.width / 2, canvas.height / 2);
        ctx.font = "20px Arial";
        ctx.fillText("Presiona R para reiniciar", canvas.width / 2, canvas.height / 2 + 80);
    }
}

function loop() {
    actualizar();
    dibujar();
    requestAnimationFrame(loop);
}

setInterval(crearObstaculo, 2000);
setInterval(crearPowerUp, 1500);
loop();