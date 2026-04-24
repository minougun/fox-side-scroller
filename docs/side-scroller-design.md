# Fox Side Scroller Design Handoff

Date: 2026-04-24

## Scope

Browser-only playable prototype for a horizontal 2D side-scrolling game. The project is static HTML/CSS/JavaScript and can run from a local HTTP server without a build step.

## Local Paths

- Project: `/mnt/c/Users/minou/fox-side-scroller/`
- Entry point: `/mnt/c/Users/minou/fox-side-scroller/index.html`
- Game logic: `/mnt/c/Users/minou/fox-side-scroller/src/main.js`
- Styles: `/mnt/c/Users/minou/fox-side-scroller/src/styles.css`
- Generated assets: `/mnt/c/Users/minou/fox-side-scroller/assets/generated/`

## Generated Asset Sources

Generated with the built-in image generation tool and copied into the project:

- `/home/minougun/.codex-wsl/generated_images/019dbfbc-aec2-7c72-ade7-ab1639f03c48/ig_001041adeac2a3600169eb74b75f348191a7e3f39aa8af6a21.png` -> `assets/generated/hero-sprite-reference.png`
- `/home/minougun/.codex-wsl/generated_images/019dbfbc-aec2-7c72-ade7-ab1639f03c48/ig_001041adeac2a3600169eb7514cea08191a8fe30d43fb20304.png` -> `assets/generated/enemy-pickup-reference.png`
- `/home/minougun/.codex-wsl/generated_images/019dbfbc-aec2-7c72-ade7-ab1639f03c48/ig_001041adeac2a3600169eb7562612481918e1d7c0e27c9b33e.png` -> `assets/generated/forest-ruins-panorama.png`

## Music

BGM is generated at runtime through WebAudio. It is an original 16-bit-inspired ambient platformer loop with plucked lead, soft bass, filtered pad, and percussion noise. It intentionally avoids copying existing game songs or a living composer's exact style.

## Implementation Notes

- The generated panorama is used directly as a parallax background.
- The hero and enemies are drawn procedurally on canvas so animation states remain stable and smooth.
- Hero states: idle, run, jump, fall, dash, hurt/invulnerable, clear.
- Enemies: beetle, slime block, seed drone, rolling seed pod.
- 2026-04-24 update: hero facing was corrected so the snout points in the movement direction. The fox read was strengthened with a longer cream muzzle, aligned black nose, cheek tufts, larger ears, and a white-tipped tail.
- 2026-04-24 update: enemy defeat now triggers a dedicated explosion animation with expanding rings, smoke puffs, chunks, and reduced-motion scaling.
- 2026-04-24 update: in-game operation guide was removed; controls are documented in handoff/final response instead.
- 2026-04-24 update: stages are now data-driven. Stage 1 was extended from the original single short course to a 9000px course, and two additional stages were added.
- 2026-04-24 update: the fox can use two weapons: sword with a forward melee arc, and gun with projectile shots. Weapons are now stage pickups; `1` and `2` only work after the corresponding weapon has been collected.
- 2026-04-24 update: each stage now places sword and gun pickups in the course. Stage transitions preserve collected weapons, while retrying a stage resets pickups for that stage.
- 2026-04-24 update: the earlier low-resolution-only look was replaced with hand-built SFC-style pixel rendering. The background, platforms, fox, enemies, weapon pickups, projectiles, goal, and explosion feedback now use blocky tile/palette construction instead of smooth curves and generated-image downscaling. Combat feedback keeps dash/sword/gun screen shake, square particle sparks, projectile trails, enemy defeat chunks, and player afterimages.
- 2026-04-24 update: the background only was restored to the initial generated panorama and smooth parallax sky treatment. Foreground gameplay objects remain in the current SFC-style pixel rendering layer.
- 2026-04-25 update: the 68-point persona review issues were addressed with hit stop, stronger weapon impact bursts, enemy stun/knockback/hurt poses, enemy HP, upgraded enemy silhouettes, player landing/turn/pickup animation accents, weapon-state HUD icons, a scene-grade pass that blends the restored smooth background with the pixel foreground, and a safer Stage 1 pickup-to-first-enemy rhythm.
- 2026-04-25 update: player and enemy rendering now uses a full-resolution gameplay layer instead of a 3x-upscaled low-resolution layer, reducing movement quantization while keeping the block-built pixel-art look. Fox run/idle motion and pod rotation were changed from stepped frames to continuous motion. Enemy defeats now add score, update the HUD, and spawn floating score popups.
- 2026-04-25 update: progression blockers from unreachable platforms were corrected. Mandatory floor gaps are now capped at 120px across all stages, raised platforms are capped at 120px above the floor line, and jump strength was increased from 760 to 820 vertical speed for a more forgiving normal jump.
- 2026-04-25 update: enemy defeat score feedback was restyled as a large numbers-only popup near the defeat point, while the HUD score keeps zero padding. The fox design was returned to the earlier clean fox look, while enemies retain darker arcade-style accents. The sword hitbox remains wider with a small forward lunge to make score-triggering kills easier.
- 2026-04-25 update: DualShock 4 / PS4 controller support was added through the browser Gamepad API. The app now polls connected standard gamepads each frame and maps left stick/D-pad movement, Cross jump/start, Square attack, Circle/R2 dash, L1 sword select, R1 gun select, and Triangle weapon cycling.
- 2026-04-25 update: session progression now uses the `1-1`, `1-2`, `1-3` pattern and continues through `3-3`. The original three-session-per-stage rhythm is preserved, while the total local build has nine sessions.
- 2026-04-25 update: each session now includes a key pickup and a locked gate before the goal. The player must collect the key to open the gate and clear the session.
- 2026-04-25 update: later sessions remix the existing reachable terrain with denser enemy placement and extra fruit, so the challenge increases without reintroducing unreachable jumps.
- 2026-04-25 update: mobile play now has dedicated touch controls for left, right, weapon cycle, dash, attack, and jump. HUD score text was adjusted to avoid wrapping on phone-width viewports.
- 2026-04-25 update: a pre-start difficulty selector was added. Easy reduces enemy count, speed, patrol range, drone hover amplitude, and enemy HP while giving the player 4 hearts. Normal preserves the baseline. Hard adds extra enemies and increases enemy speed, patrol range, drone hover amplitude, and HP.
- Inputs: keyboard, touch buttons, and browser Gamepad API controllers such as DualShock 4 / PS4 controllers.
- `prefers-reduced-motion` reduces particle count and parallax movement while preserving playability.

## Controls

- Move: `Left/Right` or `A/D`
- Jump: `Space`, `Up`, or `W`
- Dash: `Shift`
- Select sword after pickup: `1`
- Select gun after pickup: `2`
- Attack with selected collected weapon: `J` or `K`
- Touch: `‹`/`›` move, `⌃` jumps, `↯` dashes, `✦` attacks with the selected weapon, and `⇄` cycles collected weapons.
- PS4 controller: left stick or D-pad moves, Cross jumps/starts, Square attacks, Circle or R2 dashes, L1 selects sword, R1 selects gun, Triangle cycles collected weapons.

## Current Session List

- Stage 1 sessions: `1-1 Forest Run`, `1-2 Canopy Ruins`, `1-3 Moonlit Grove`
- Stage 2 sessions: `2-1 Riverfall Outpost`, `2-2 Mossworks Lift`, `2-3 Amber Gate`
- Stage 3 sessions: `3-1 Cinderroot Run`, `3-2 Fossil Canopy`, `3-3 Moon Crown`

## Progression Gates

- Every session has one key item and one locked gate.
- Closed gates participate in collision and the goal only clears when all gates in the session are open.
- Key collection opens the session gate and triggers a small feedback burst.

## Difficulty Rules

- `Easy`: about two thirds of baseline enemies remain, enemy speed is scaled down, patrol ranges are shorter, drone hover movement is smaller, enemy HP is reduced with a minimum of 1, and player health starts at 4.
- `Normal`: baseline enemy count, movement, HP, and 3 player health.
- `Hard`: baseline enemies plus cloned pressure enemies, faster movement, wider patrol ranges, stronger drone hover movement, +1 enemy HP, and 3 player health.

## GitHub / Docs Mapping

- GitHub Issue: not_applicable, direct production push was requested without issue workflow.
- Commit: recorded in final completion report for the production push.
- PR: not_applicable, direct push to `main` was requested.
- Design doc: `/mnt/c/Users/minou/fox-side-scroller/docs/side-scroller-design.md`
- Review doc: `/mnt/c/Users/minou/fox-side-scroller/docs/persona-review-2026-04-24.md`
- Follow-up review doc: `/mnt/c/Users/minou/fox-side-scroller/docs/persona-review-2026-04-25.md`
- Smooth/score review doc: `/mnt/c/Users/minou/fox-side-scroller/docs/persona-review-smooth-score-2026-04-25.md`
- Publication doc: `/mnt/c/Users/minou/fox-side-scroller/docs/publication-2026-04-25.md`
- Rights review doc: `/mnt/c/Users/minou/fox-side-scroller/docs/rights-review-2026-04-25.md`
