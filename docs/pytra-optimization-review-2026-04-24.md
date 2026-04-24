# Pytra Optimization Review

Date: 2026-04-24

## Scope

- Reviewed project: `/mnt/c/Users/minou/fox-side-scroller/`
- Main source: `/mnt/c/Users/minou/fox-side-scroller/src/main.js`
- Pytra official source: `https://github.com/yaneurao/Pytra/`
- Local Pytra: `/mnt/c/Users/minou/Pytra/`
- Local Pytra commit used: `7bd528c4e6d15fd3f5d2bcb409671fe7b48362fb`

## Pytra Result

Pytra was updated to the latest observed `origin/main` commit before review.

Commands run from `/mnt/c/Users/minou/Pytra/`:

```bash
git fetch origin main --prune
git pull --ff-only origin main
./pytra -parse /mnt/c/Users/minou/fox-side-scroller/src/main.js
./pytra -resolve work/tmp/east1/main.js.east1
./pytra -compile work/tmp/east2/main.js.east2
./pytra -optimize work/tmp/east3/main.js.east3
```

Artifacts:

- `/mnt/c/Users/minou/Pytra/work/tmp/east1/main.js.east1`
- `/mnt/c/Users/minou/Pytra/work/tmp/east2/main.js.east2`
- `/mnt/c/Users/minou/Pytra/work/tmp/east3/main.js.east3`
- `/mnt/c/Users/minou/Pytra/work/tmp/east3-opt/main.js.east3`

Important limitation: Pytra is specified as a typed Python-to-target-language transpiler. The game source is JavaScript, so this is not a valid full-source Pytra optimization pass. Pytra parsed only a tiny subset-like fragment from `main.js`: EAST3 had `body_len = 4`, `main_guard_body = 0`, and the optimized EAST3 was byte-identical to the compiled EAST3.

Result: Pytra cannot be used as proof that the JavaScript game source is optimized.

## Runtime Measurement

Browser check with Playwright against `http://127.0.0.1:4174/`:

- Average frame interval: `16.6659 ms`
- Approx FPS: `60.00`
- p95 frame interval: `16.70 ms`
- Max frame interval: `16.80 ms`
- Console/page errors: none

Runtime appears stable in the short sampled path.

## Optimization Findings

1. `main.js` still contains dead legacy smooth-rendering code after an early `return` in `drawPlayer()`.
   - This does not run per frame, but it increases parse size and makes future edits riskier.
   - Related unused functions: `drawLeg`, `drawArm`, `drawWeapon`, `drawEar`, `drawCheekTuft`, `roundedRect`, `softBlob`, `drawDistantHills`.

2. Generated reference images are still loaded but no longer used by active rendering.
   - `heroRef` and `enemyRef` in `assets` are loaded from:
     - `/mnt/c/Users/minou/fox-side-scroller/assets/generated/hero-sprite-reference.png`
     - `/mnt/c/Users/minou/fox-side-scroller/assets/generated/enemy-pickup-reference.png`
   - Removing those loads would reduce startup network/file work.

3. Current active render is already lightweight enough for desktop headless Chromium in the sampled path.
   - The main optimization target is source cleanup and asset loading, not urgent frame-time reduction.

4. Pytra optimizer in the checked local commit currently uses an empty default pass manager in `/mnt/c/Users/minou/Pytra/src/toolchain/optimize/optimizer.py`.
   - Even for valid EAST3 input, the observed default optimizer path is conservative/no-op unless supplied with a pass manager elsewhere.

## Recommendation

Before adding more gameplay features, clean the JS source:

- Remove unused generated image loads for hero/enemy references.
- Delete the unreachable old smooth `drawPlayer()` body after the early `return`.
- Delete helper functions only referenced by that unreachable path.
- Re-run `node --check`, Playwright frame sampling, and reduced-motion check.

This is a local cleanup and does not require Pytra conversion unless the game logic is first ported to typed Python/Pytra source.

## GitHub / Docs Mapping

- GitHub Issue: not_applicable, local-only prototype and no target repository/remote was specified.
- Commit: not_applicable, no commit requested.
- PR: not_applicable, no remote publication requested.
- Design/review doc: `/mnt/c/Users/minou/fox-side-scroller/docs/pytra-optimization-review-2026-04-24.md`
