export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

export const OPPOSITE_DIRECTION = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT'
};

export function createInitialState(gridSize = 20) {
  const center = Math.floor(gridSize / 2);
  const snake = [
    { x: center, y: center },
    { x: center - 1, y: center },
    { x: center - 2, y: center }
  ];

  return {
    gridSize,
    snake,
    direction: 'RIGHT',
    pendingDirection: 'RIGHT',
    food: placeFood(gridSize, snake),
    score: 0,
    gameOver: false,
    paused: false
  };
}

export function queueDirection(state, nextDirection) {
  if (!DIRECTIONS[nextDirection]) {
    return state.pendingDirection;
  }

  if (OPPOSITE_DIRECTION[state.direction] === nextDirection && state.snake.length > 1) {
    return state.pendingDirection;
  }

  return nextDirection;
}

export function stepGame(state) {
  if (state.gameOver || state.paused) {
    return state;
  }

  const direction = state.pendingDirection;
  const vector = DIRECTIONS[direction];
  const currentHead = state.snake[0];
  const newHead = {
    x: currentHead.x + vector.x,
    y: currentHead.y + vector.y
  };

  const hitWall =
    newHead.x < 0 ||
    newHead.y < 0 ||
    newHead.x >= state.gridSize ||
    newHead.y >= state.gridSize;

  const willEat = newHead.x === state.food.x && newHead.y === state.food.y;
  const bodyToCheck = willEat ? state.snake : state.snake.slice(0, -1);
  const hitSelf = bodyToCheck.some((segment) => segment.x === newHead.x && segment.y === newHead.y);

  if (hitWall || hitSelf) {
    return {
      ...state,
      direction,
      gameOver: true
    };
  }

  const snake = [newHead, ...state.snake];
  if (!willEat) {
    snake.pop();
  }

  return {
    ...state,
    snake,
    direction,
    pendingDirection: direction,
    score: state.score + (willEat ? 1 : 0),
    food: willEat ? placeFood(state.gridSize, snake) : state.food
  };
}

export function placeFood(gridSize, snake, randomFn = Math.random) {
  const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
  const freeCells = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) {
        freeCells.push({ x, y });
      }
    }
  }

  if (freeCells.length === 0) {
    return null;
  }

  const index = Math.floor(randomFn() * freeCells.length);
  return freeCells[index];
}
