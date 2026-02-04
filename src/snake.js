import { createInitialState, queueDirection, stepGame } from './gameLogic.js';

const CELL_SIZE = 20;
const TICK_MS = 130;

const canvas = document.getElementById('game-board');
const context = canvas.getContext('2d');
const scoreEl = document.getElementById('score-value');
const highScoreEl = document.getElementById('high-score-value');
const stateEl = document.getElementById('game-state');
const restartButton = document.getElementById('restart-button');
const pauseButton = document.getElementById('pause-button');
const controlButtons = document.querySelectorAll('[data-direction]');

let gameState = createInitialState(20);
let tickHandle = null;
const HIGH_SCORE_KEY = 'classic-snake-high-score';

function readHighScore() {
  try {
    const value = Number(localStorage.getItem(HIGH_SCORE_KEY) || '0');
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function writeHighScore(value) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(value));
  } catch {
    // Ignore storage failures.
  }
}

function drawGrid() {
  context.strokeStyle = '#d8d8d8';
  context.lineWidth = 1;

  for (let i = 0; i <= gameState.gridSize; i += 1) {
    const p = i * CELL_SIZE;
    context.beginPath();
    context.moveTo(p, 0);
    context.lineTo(p, canvas.height);
    context.stroke();
    context.beginPath();
    context.moveTo(0, p);
    context.lineTo(canvas.width, p);
    context.stroke();
  }
}

function drawObstacle(x, y) {
  const cx = x * CELL_SIZE + CELL_SIZE / 2;
  const cy = y * CELL_SIZE + CELL_SIZE / 2;
  const r = CELL_SIZE * 0.14;

  context.fillStyle = '#6b6b6b';
  context.beginPath();
  context.arc(cx - 4, cy + 1, r * 1.2, 0, Math.PI * 2);
  context.arc(cx + 1, cy - 3, r * 1.4, 0, Math.PI * 2);
  context.arc(cx + 4, cy + 2, r, 0, Math.PI * 2);
  context.fill();
}

function drawApple(x, y) {
  const cx = x * CELL_SIZE + CELL_SIZE / 2;
  const cy = y * CELL_SIZE + CELL_SIZE / 2 + 1;
  const r = CELL_SIZE * 0.33;

  context.fillStyle = '#d64541';
  context.beginPath();
  context.arc(cx - r * 0.45, cy, r, 0, Math.PI * 2);
  context.arc(cx + r * 0.45, cy, r, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#7b3f00';
  context.fillRect(cx - 1, cy - r * 1.55, 2, 5);

  context.fillStyle = '#4caf50';
  context.beginPath();
  context.ellipse(cx + 4, cy - r * 1.15, 4, 2, -0.45, 0, Math.PI * 2);
  context.fill();
}

function drawOrange(x, y) {
  const cx = x * CELL_SIZE + CELL_SIZE / 2;
  const cy = y * CELL_SIZE + CELL_SIZE / 2;
  const r = CELL_SIZE * 0.34;

  context.fillStyle = '#f28b1d';
  context.beginPath();
  context.arc(cx, cy, r, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#f7a944';
  context.beginPath();
  context.arc(cx - r * 0.25, cy - r * 0.25, r * 0.35, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#3f8f3f';
  context.beginPath();
  context.ellipse(cx + 2, cy - r * 0.95, 3.5, 2, -0.35, 0, Math.PI * 2);
  context.fill();
}

function drawSnakeBody(segment, index, length) {
  const cx = segment.x * CELL_SIZE + CELL_SIZE / 2;
  const cy = segment.y * CELL_SIZE + CELL_SIZE / 2;
  const taper = index / Math.max(1, length - 1);
  const radius = CELL_SIZE * (0.38 - taper * 0.13);

  context.fillStyle = '#4f9d53';
  context.beginPath();
  context.arc(cx, cy, radius, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#79c57a';
  context.beginPath();
  context.arc(cx - radius * 0.28, cy - radius * 0.35, radius * 0.42, 0, Math.PI * 2);
  context.fill();
}

function drawSnakeHead(segment, direction) {
  const cx = segment.x * CELL_SIZE + CELL_SIZE / 2;
  const cy = segment.y * CELL_SIZE + CELL_SIZE / 2;
  const eyeOffset = CELL_SIZE * 0.18;
  const eyeRadius = 1.8;
  const noseOffset = CELL_SIZE * 0.28;

  context.fillStyle = '#2f7d32';
  context.beginPath();
  context.arc(cx, cy, CELL_SIZE * 0.43, 0, Math.PI * 2);
  context.fill();

  let eyes = [];
  if (direction === 'UP') {
    eyes = [
      { x: cx - eyeOffset, y: cy - eyeOffset },
      { x: cx + eyeOffset, y: cy - eyeOffset }
    ];
  } else if (direction === 'DOWN') {
    eyes = [
      { x: cx - eyeOffset, y: cy + eyeOffset },
      { x: cx + eyeOffset, y: cy + eyeOffset }
    ];
  } else if (direction === 'LEFT') {
    eyes = [
      { x: cx - eyeOffset, y: cy - eyeOffset },
      { x: cx - eyeOffset, y: cy + eyeOffset }
    ];
  } else {
    eyes = [
      { x: cx + eyeOffset, y: cy - eyeOffset },
      { x: cx + eyeOffset, y: cy + eyeOffset }
    ];
  }

  context.fillStyle = '#ffffff';
  eyes.forEach((eye) => {
    context.beginPath();
    context.arc(eye.x, eye.y, eyeRadius, 0, Math.PI * 2);
    context.fill();
  });

  context.fillStyle = '#111111';
  eyes.forEach((eye) => {
    context.beginPath();
    context.arc(eye.x, eye.y, eyeRadius * 0.5, 0, Math.PI * 2);
    context.fill();
  });

  context.strokeStyle = '#b71c1c';
  context.lineWidth = 1.4;
  context.beginPath();
  if (direction === 'UP') {
    context.moveTo(cx, cy - noseOffset);
    context.lineTo(cx - 3, cy - noseOffset - 3);
    context.moveTo(cx, cy - noseOffset);
    context.lineTo(cx + 3, cy - noseOffset - 3);
  } else if (direction === 'DOWN') {
    context.moveTo(cx, cy + noseOffset);
    context.lineTo(cx - 3, cy + noseOffset + 3);
    context.moveTo(cx, cy + noseOffset);
    context.lineTo(cx + 3, cy + noseOffset + 3);
  } else if (direction === 'LEFT') {
    context.moveTo(cx - noseOffset, cy);
    context.lineTo(cx - noseOffset - 3, cy - 3);
    context.moveTo(cx - noseOffset, cy);
    context.lineTo(cx - noseOffset - 3, cy + 3);
  } else {
    context.moveTo(cx + noseOffset, cy);
    context.lineTo(cx + noseOffset + 3, cy - 3);
    context.moveTo(cx + noseOffset, cy);
    context.lineTo(cx + noseOffset + 3, cy + 3);
  }
  context.stroke();
}

function render() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  gameState.obstacles.forEach((obstacle) => {
    drawObstacle(obstacle.x, obstacle.y);
  });

  if (gameState.food) {
    if (gameState.foodType === 'ORANGE') {
      drawOrange(gameState.food.x, gameState.food.y);
    } else {
      drawApple(gameState.food.x, gameState.food.y);
    }
  }

  gameState.snake.forEach((segment, index) => {
    if (index === 0) {
      drawSnakeHead(segment, gameState.direction);
    } else {
      drawSnakeBody(segment, index, gameState.snake.length);
    }
  });

  scoreEl.textContent = String(gameState.score);
  const storedHighScore = readHighScore();
  const highScore = Math.max(storedHighScore, gameState.score);
  if (highScore > storedHighScore) {
    writeHighScore(highScore);
  }
  highScoreEl.textContent = String(highScore);

  if (gameState.gameOver) {
    stateEl.textContent = 'Game over';
  } else if (gameState.paused) {
    stateEl.textContent = 'Paused';
  } else {
    stateEl.textContent = 'Running';
  }

  pauseButton.textContent = gameState.paused ? 'Resume' : 'Pause';
}

function setDirection(direction) {
  gameState = {
    ...gameState,
    pendingDirection: queueDirection(gameState, direction)
  };
}

function tick() {
  gameState = stepGame(gameState);

  if (gameState.food === null && !gameState.gameOver) {
    gameState = {
      ...gameState,
      gameOver: true
    };
    stateEl.textContent = 'You win';
  }

  render();
}

function startLoop() {
  if (tickHandle) {
    clearInterval(tickHandle);
  }

  tickHandle = setInterval(() => {
    if (!gameState.gameOver && !gameState.paused) {
      tick();
    }
  }, TICK_MS);
}

function restart() {
  gameState = createInitialState(20);
  render();
}

const keyToDirection = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  w: 'UP',
  a: 'LEFT',
  s: 'DOWN',
  d: 'RIGHT',
  W: 'UP',
  A: 'LEFT',
  S: 'DOWN',
  D: 'RIGHT'
};

window.addEventListener('keydown', (event) => {
  const direction = keyToDirection[event.key];
  if (!direction) {
    return;
  }

  event.preventDefault();

  if (gameState.gameOver) {
    restart();
  }

  setDirection(direction);
});

restartButton.addEventListener('click', restart);

pauseButton.addEventListener('click', () => {
  if (gameState.gameOver) {
    return;
  }

  gameState = {
    ...gameState,
    paused: !gameState.paused
  };
  render();
});

controlButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const direction = button.dataset.direction;
    if (direction) {
      if (gameState.gameOver) {
        restart();
      }
      setDirection(direction);
    }
  });
});

render();
startLoop();
