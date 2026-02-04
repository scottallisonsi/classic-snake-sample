# Classic Snake

Minimal browser Snake game with keyboard and touch controls.

## Run

```bash
cd "/Users/scottsi/Documents/New project"
npm run start
```

Open [http://localhost:5173](http://localhost:5173).

## Test

```bash
cd "/Users/scottsi/Documents/New project"
npm test
```

## Controls

- Arrow keys or `W/A/S/D`
- `Pause` / `Resume`
- `Restart`

## Manual verification checklist

- Snake moves one cell per tick in the current direction.
- Snake grows and score increases after eating food.
- Hitting walls or self ends the game.
- Pause stops movement; resume continues.
- Restart resets the board and score.
- High score persists across restarts/page reloads.
