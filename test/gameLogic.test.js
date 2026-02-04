import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialState, placeFood, queueDirection, stepGame } from '../src/gameLogic.js';

test('snake moves one cell per step in current direction', () => {
  const state = createInitialState(10);
  const next = stepGame(state);

  assert.equal(next.snake[0].x, state.snake[0].x + 1);
  assert.equal(next.snake[0].y, state.snake[0].y);
  assert.equal(next.snake.length, state.snake.length);
});

test('snake grows and score increments when eating food', () => {
  const state = createInitialState(10);
  const foodAhead = { x: state.snake[0].x + 1, y: state.snake[0].y };
  const ready = { ...state, food: foodAhead };

  const next = stepGame(ready);

  assert.equal(next.snake.length, ready.snake.length + 1);
  assert.equal(next.score, ready.score + 1);
  assert.notEqual(next.food, null);
});

test('game ends on wall collision', () => {
  const state = {
    ...createInitialState(5),
    snake: [{ x: 4, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 2 }],
    direction: 'RIGHT',
    pendingDirection: 'RIGHT'
  };

  const next = stepGame(state);
  assert.equal(next.gameOver, true);
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
