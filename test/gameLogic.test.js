import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createInitialState,
  placeFood,
  placeObstacle,
  placeObstacleCluster,
  queueDirection,
  stepGame
} from '../src/gameLogic.js';

function sequenceRandom(values) {
  const list = [...values];
  return () => {
    if (list.length === 0) {
      return 0;
    }
    return list.shift();
  };
}

function isStraightContiguousLine(cells) {
  if (cells.length < 2) {
    return true;
  }

  const sortedByXThenY = [...cells].sort((a, b) => (a.x - b.x) || (a.y - b.y));
  const sortedByYThenX = [...cells].sort((a, b) => (a.y - b.y) || (a.x - b.x));

  const sameX = cells.every((cell) => cell.x === cells[0].x);
  if (sameX) {
    for (let i = 1; i < sortedByYThenX.length; i += 1) {
      if (sortedByYThenX[i].y !== sortedByYThenX[i - 1].y + 1) {
        return false;
      }
    }
    return true;
  }

  const sameY = cells.every((cell) => cell.y === cells[0].y);
  if (sameY) {
    for (let i = 1; i < sortedByXThenY.length; i += 1) {
      if (sortedByXThenY[i].x !== sortedByXThenY[i - 1].x + 1) {
        return false;
      }
    }
    return true;
  }

  return false;
}

test('initial food type starts as APPLE', () => {
  const state = createInitialState(10);
  assert.equal(state.foodType, 'APPLE');
});

test('snake moves one cell per step in current direction', () => {
  const state = createInitialState(10);
  const next = stepGame(state);

  assert.equal(next.snake[0].x, state.snake[0].x + 1);
  assert.equal(next.snake[0].y, state.snake[0].y);
  assert.equal(next.snake.length, state.snake.length);
});

test('snake grows, score increments, and fruit toggles when eating food', () => {
  const state = createInitialState(10);
  const foodAhead = { x: state.snake[0].x + 1, y: state.snake[0].y };
  const ready = { ...state, food: foodAhead, foodType: 'APPLE' };

  const next = stepGame(ready);

  assert.equal(next.snake.length, ready.snake.length + 1);
  assert.equal(next.score, ready.score + 1);
  assert.notEqual(next.food, null);
  assert.equal(next.foodType, 'ORANGE');
});

test('fruit toggles back to APPLE after next eat', () => {
  const state = {
    ...createInitialState(10),
    snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }],
    direction: 'RIGHT',
    pendingDirection: 'RIGHT',
    food: { x: 6, y: 5 },
    foodType: 'ORANGE',
    obstacles: []
  };

  const next = stepGame(state, sequenceRandom([0, 0, 0]));
  assert.equal(next.foodType, 'APPLE');
});

test('snake wraps through walls to the opposite side', () => {
  const state = {
    ...createInitialState(5),
    snake: [{ x: 4, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 2 }],
    direction: 'RIGHT',
    pendingDirection: 'RIGHT'
  };

  const next = stepGame(state);
  assert.equal(next.gameOver, false);
  assert.deepEqual(next.snake[0], { x: 0, y: 2 });
});

test('game ends on self collision', () => {
  const state = {
    ...createInitialState(7),
    snake: [
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 3, y: 3 },
      { x: 2, y: 3 },
      { x: 1, y: 3 },
      { x: 1, y: 2 }
    ],
    direction: 'DOWN',
    pendingDirection: 'DOWN'
  };

  const next = stepGame(state);
  assert.equal(next.gameOver, true);
});

test('game ends on obstacle collision', () => {
  const state = {
    ...createInitialState(10),
    snake: [{ x: 3, y: 2 }, { x: 2, y: 2 }, { x: 1, y: 2 }],
    obstacles: [{ x: 4, y: 2 }],
    direction: 'RIGHT',
    pendingDirection: 'RIGHT'
  };

  const next = stepGame(state);
  assert.equal(next.gameOver, true);
});

test('cannot immediately reverse direction', () => {
  const state = createInitialState(10);
  const queued = queueDirection(state, 'LEFT');

  assert.equal(queued, 'RIGHT');
});

test('placeFood picks only free cells deterministically by randomFn', () => {
  const snake = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 }
  ];

  const food = placeFood(3, snake, () => 0);
  assert.deepEqual(food, { x: 0, y: 1 });
});

test('placeFood avoids obstacles', () => {
  const snake = [{ x: 0, y: 0 }];
  const obstacles = [{ x: 0, y: 1 }];
  const food = placeFood(2, snake, obstacles, () => 0);
  assert.deepEqual(food, { x: 1, y: 0 });
});

test('placeObstacle avoids snake, food, and existing obstacles', () => {
  const snake = [{ x: 0, y: 0 }];
  const food = { x: 1, y: 0 };
  const obstacles = [{ x: 0, y: 1 }];
  const obstacle = placeObstacle(2, snake, food, obstacles, () => 0);
  assert.deepEqual(obstacle, { x: 1, y: 1 });
});

test('placeObstacleCluster creates at least 3 connected blocks in one direction', () => {
  const cluster = placeObstacleCluster(8, [{ x: 0, y: 0 }], { x: 7, y: 7 }, [], 3, () => 0);

  assert.equal(cluster.length, 3);
  assert.equal(isStraightContiguousLine(cluster), true);
});

test('obstacles spawn only after the snake eats an apple', () => {
  const state = {
    ...createInitialState(10),
    snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }],
    direction: 'RIGHT',
    pendingDirection: 'RIGHT',
    food: { x: 6, y: 5 },
    obstacles: []
  };

  const afterEat = stepGame(state, sequenceRandom([0, 0, 0]));
  assert.equal(afterEat.obstacles.length >= 3, true);

  const withoutEat = stepGame(
    { ...state, food: { x: 9, y: 9 }, obstacles: [] },
    sequenceRandom([0, 0, 0])
  );
  assert.equal(withoutEat.obstacles.length, 0);
});
