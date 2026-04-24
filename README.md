# Fox Side Scroller

Browser-only 2D side-scrolling action game prototype.

## Play

GitHub Pages URL:

- https://minougun.github.io/fox-side-scroller/

Current local source path:

- `/mnt/c/Users/minou/fox-side-scroller/`

## Local Run

```bash
python3 -m http.server 4174 --bind 127.0.0.1
```

Then open:

- http://127.0.0.1:4174/

## Controls

- First launch only: select language and difficulty before starting
- Move: Left/Right or A/D
- Jump: Space, Up, or W
- Dash: Shift
- Attack: J or K
- Select sword after pickup: 1
- Select gun after pickup: 2
- Touch: hold left/right side of the screen to move, double tap to jump, tap to attack, flick left/right to dash, and two-finger tap to cycle collected weapons
- PS4 controller: left stick/D-pad moves, Cross jumps/starts, Square attacks, Circle/R2 dashes, L1 selects sword, R1 selects gun, Triangle cycles weapons

## Sessions

The current local build has nine sessions: 1-1, 1-2, 1-3, 2-1, 2-2, 2-3, 3-1, 3-2, and 3-3. Each session has a key pickup and a locked gate before the goal.

## Difficulty

- Easy: fewer enemies, slower patrols, shorter drone movement, and 4 player hearts
- Normal: baseline enemy count, speed, movement, and 3 player hearts
- Hard: extra enemies, faster patrols, wider movement, stronger enemy HP, and 3 player hearts
