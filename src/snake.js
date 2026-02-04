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

function drawCell(x, y, fill) {
  context.fillStyle = fill;
  context.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
}

function render() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  if (gameState.food) {
    drawCell(gameState.food.x, gameState.food.y, '#d64541');
  }

  gameState.snake.forEach((segment, index) => {
    drawCell(segment.x, segment.y, index === 0 ? '#2f7d32' : '#66bb6a');
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
