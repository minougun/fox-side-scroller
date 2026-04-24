# Persona Review: Smooth Motion And Score Build

Date: 2026-04-25

## Accessed Work

- Local project: `/mnt/c/Users/minou/fox-side-scroller/`
- Browser URL: `http://127.0.0.1:4174/`
- Main source: `/mnt/c/Users/minou/fox-side-scroller/src/main.js`
- Markup: `/mnt/c/Users/minou/fox-side-scroller/index.html`
- Styles: `/mnt/c/Users/minou/fox-side-scroller/src/styles.css`
- Design handoff: `/mnt/c/Users/minou/fox-side-scroller/docs/side-scroller-design.md`
- Previous review: `/mnt/c/Users/minou/fox-side-scroller/docs/persona-review-2026-04-25.md`

## Persona

Name: Kenta

Profile: 34-year-old action-game player who likes SFC-era platformers and arcade 2D action games. He is sensitive to animation smoothness, hit feel, readable enemies, score feedback, and whether the first 60 seconds make him want to continue.

## Current Score

Overall score: 91 / 100

Breakdown:

- Character appeal and fox readability: 18 / 20
- Movement smoothness and animation feel: 18 / 20
- Combat feedback and enemy defeat feel: 19 / 20
- Score/reward feedback: 9 / 10
- Stage onboarding and first-minute rhythm: 17 / 20
- Audio and mood: 10 / 10

## Harsh Review

The smoothness fix helped. The game no longer looks like the foreground is being magnified from a tiny canvas, and the fox reads better while moving. The block-built pixel style is still there, but it now feels less like technical roughness and more like a deliberate visual treatment over the restored background.

The score HUD is a good addition because it gives enemy defeats a clear reward loop. Floating score popups also fit the arcade-action direction. This makes combat feel less empty after the explosion and gives the player a reason to care about enemies beyond survival.

The main remaining weakness is that the first enemy interaction is still a little too finicky. The sword is picked up clearly, but the ideal spacing for the first hit is not immediately obvious. For a game aiming at arcade-feel polish, the first enemy after a weapon pickup should almost guarantee a satisfying hit within one or two button presses.

The animation is smoother, but it is not yet "premium sprite animation." It is still procedural block animation. That is acceptable for a prototype, but the Metal Slug comparison raises the bar: the character needs authored anticipations, recovery frames, weapon-specific body poses, and more expressive enemy hurt/death frames.

## What Improved Since The 90-Point Review

- Full-resolution gameplay rendering removed the most visible movement quantization.
- Fox run and idle motion now feel smoother than the stepped frame pass.
- Enemy movement, especially rolling behavior, looks less mechanically snapped.
- Score HUD and floating score popups make enemy defeat feel more complete.
- Mobile HUD still fits after adding the score panel.

## Highest-Impact Remaining Fixes

Priority 1: Make the first sword hit easier

Move the first enemy slightly closer to the player after the pickup, widen the sword hitbox a bit, or add a short forward lunge during sword attacks. This is the biggest remaining first-minute feel issue.

Priority 2: Add score design beyond flat enemy points

Add combo/multiplier, no-damage bonus, fruit streak bonus, and stage-clear tally. The score currently works, but it is not yet a system players can optimize.

Priority 3: Add authored combat frames

Add dedicated sword windup, slash, follow-through, gun recoil, hurt, and victory poses. Smooth procedural motion fixed the technical roughness, but authored poses are needed for the requested arcade-quality feel.

Priority 4: Give enemies visible attack intent

Enemies should show a charge, hop, dive, or roll warning before they become dangerous. The current enemies are readable, but not yet expressive enough to feel like premium opponents.

Priority 5: Add hit-confirm accessibility

Keep the current visual impact, but add slightly clearer color/shape distinction between sword hits, gun hits, and score popups for players who do not parse small effects quickly.

## Verification

- `node --check /mnt/c/Users/minou/fox-side-scroller/src/main.js`
- `curl -I http://127.0.0.1:4174/`
- Playwright desktop review at `http://127.0.0.1:4174/`
- Playwright mobile reduced-motion review at `http://127.0.0.1:4174/`
- Desktop screenshots:
  - `/tmp/fox-persona-current-start.png`
  - `/tmp/fox-persona-current-first-enemy.png`
  - `/tmp/fox-persona-current-combat.png`
- Mobile reduced-motion screenshot:
  - `/tmp/fox-persona-current-mobile-reduce.png`

## GitHub / Docs Mapping

- GitHub Issue: not_applicable, local-only prototype request and no target repository/remote was specified.
- Commit: not_applicable, no commit requested.
- PR: not_applicable, no remote publication requested.
- Design doc: `/mnt/c/Users/minou/fox-side-scroller/docs/side-scroller-design.md`
- Previous review doc: `/mnt/c/Users/minou/fox-side-scroller/docs/persona-review-2026-04-25.md`
- Current review doc: `/mnt/c/Users/minou/fox-side-scroller/docs/persona-review-smooth-score-2026-04-25.md`
