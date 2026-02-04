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

const MIN_OBSTACLE_CLUSTER_SIZE = 3;

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
    food: placeFood(gridSize, snake, []),
    obstacles: [],
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

export function stepGame(state, randomFn = Math.random) {
  if (state.gameOver || state.paused) {
    return state;
  }

  const direction = state.pendingDirection;
  const vector = DIRECTIONS[direction];
  const currentHead = state.snake[0];
  const wrap = (value) => (value + state.gridSize) % state.gridSize;
  const newHead = {
    x: wrap(currentHead.x + vector.x),
    y: wrap(currentHead.y + vector.y)
  };

  const willEat = state.food && newHead.x === state.food.x && newHead.y === state.food.y;
  const bodyToCheck = willEat ? state.snake : state.snake.slice(0, -1);
  const hitSelf = bodyToCheck.some((segment) => segment.x === newHead.x && segment.y === newHead.y);
  const hitObstacle = state.obstacles.some((obstacle) => obstacle.x === newHead.x && obstacle.y === newHead.y);

  if (hitSelf || hitObstacle) {
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

  let food = willEat ? placeFood(state.gridSize, snake, state.obstacles, randomFn) : state.food;
  let obstacles = state.obstacles;

  if (willEat) {
    const cluster = placeObstacleCluster(
      state.gridSize,
      snake,
      food,
      obstacles,
      MIN_OBSTACLE_CLUSTER_SIZE,
      randomFn
    );
    if (cluster.length > 0) {
      obstacles = [...obstacles, ...cluster];
      if (food && cluster.some((segment) => segment.x === food.x && segment.y === food.y)) {
        food = placeFood(state.gridSize, snake, obstacles, randomFn);
      }
    }
  }

  return {
    ...state,
    snake,
    direction,
    pendingDirection: direction,
    obstacles,
    score: state.score + (willEat ? 1 : 0),
    food
  };
}

function pickFreeCell(gridSize, occupied, randomFn) {
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

export function placeFood(gridSize, snake, obstaclesOrRandom = [], randomFn = Math.random) {
  const isRandomThirdArg = typeof obstaclesOrRandom === 'function';
  const obstacles = isRandomThirdArg ? [] : obstaclesOrRandom;
  const random = isRandomThirdArg ? obstaclesOrRandom : randomFn;

  const occupied = new Set([
    ...snake.map((segment) => `${segment.x},${segment.y}`),
    ...obstacles.map((obstacle) => `${obstacle.x},${obstacle.y}`)
  ]);

  return pickFreeCell(gridSize, occupied, random);
}

export function placeObstacle(gridSize, snake, food, obstacles, randomFn = Math.random) {
  const occupied = new Set([
    ...snake.map((segment) => `${segment.x},${segment.y}`),
    ...obstacles.map((obstacle) => `${obstacle.x},${obstacle.y}`)
  ]);

  if (food) {
    occupied.add(`${food.x},${food.y}`);
  }

  return pickFreeCell(gridSize, occupied, randomFn);
}

export function placeObstacleCluster(
  gridSize,
  snake,
  food,
  obstacles,
  minSize = MIN_OBSTACLE_CLUSTER_SIZE,
  randomFn = Math.random
) {
  const occupied = new Set([
    ...snake.map((segment) => `${segment.x},${segment.y}`),
    ...obstacles.map((obstacle) => `${obstacle.x},${obstacle.y}`)
  ]);

  if (food) {
    occupied.add(`${food.x},${food.y}`);
  }

  const freeCells = [];
  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) {
        freeCells.push({ x, y });
      }
    }
  }

  if (freeCells.length < minSize) {
    return [];
  }

  const vectors = [DIRECTIONS.UP, DIRECTIONS.RIGHT, DIRECTIONS.DOWN, DIRECTIONS.LEFT];
  const startOffset = Math.floor(randomFn() * freeCells.length);
  const directionOffset = Math.floor(randomFn() * vectors.length);

  for (let startIdx = 0; startIdx < freeCells.length; startIdx += 1) {
    const start = freeCells[(startOffset + startIdx) % freeCells.length];

    for (let dirIdx = 0; dirIdx < vectors.length; dirIdx += 1) {
      const vector = vectors[(directionOffset + dirIdx) % vectors.length];
      const cluster = [];
      let valid = true;

      for (let step = 0; step < minSize; step += 1) {
        const x = start.x + vector.x * step;
        const y = start.y + vector.y * step;

        if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) {
          valid = false;
          break;
        }

        const key = `${x},${y}`;
        if (occupied.has(key)) {
          valid = false;
          break;
        }

        cluster.push({ x, y });
      }

      if (valid) {
        return cluster;
      }
    }
  }

  return [];
}
