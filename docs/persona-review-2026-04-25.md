# Persona Review Follow-up: Fox Side Scroller

Date: 2026-04-25

## Accessed Work

- Local project: `/mnt/c/Users/minou/fox-side-scroller/`
- Browser URL: `http://127.0.0.1:4174/`
- Main source: `/mnt/c/Users/minou/fox-side-scroller/src/main.js`
- Markup: `/mnt/c/Users/minou/fox-side-scroller/index.html`
- Styles: `/mnt/c/Users/minou/fox-side-scroller/src/styles.css`
- Previous review: `/mnt/c/Users/minou/fox-side-scroller/docs/persona-review-2026-04-24.md`

## Persona

Name: Kenta

Profile: 34-year-old console and PC player who grew up with SFC action games and arcade 2D action games. He values readable character silhouettes, dense hit reactions, immediate weapon feedback, and stage layouts that teach by placement instead of text.

## Implemented Brush-up

- Added short hit stop on weapon and enemy hits.
- Added impact bursts that differ between sword, dash, stomp, and gun hits.
- Added enemy HP, stun, knockback, hurt flashes, and enemy-specific defeat debris.
- Upgraded enemy silhouettes with stronger outlines, shadows, appendages, eyes, and hurt poses.
- Added fox landing squash, turn lean, pickup flash, and stronger shadow/outlines.
- Added weapon-state HUD icons without adding an operation guide.
- Kept the restored smooth background, but added a light scene-grade pass to blend it with pixel foreground art.
- Removed whole-canvas CSS pixel scaling so the restored background remains smooth while the gameplay layer stays internally pixel-rendered.
- Tuned Stage 1 so the sword appears before the first enemy with enough room to test it safely.

## Score

Updated score: 90 / 100

Breakdown:

- Character appeal and fox readability: 18 / 20
- Action feel and combat feedback: 19 / 20
- Pixel-art direction and animation density: 17 / 20
- Stage design and onboarding: 17 / 20
- Weapon/progression clarity: 10 / 10
- Audio and mood: 9 / 10

## Harsh Review

This now crosses the threshold where the first minute feels intentionally designed instead of merely functional. The sword pickup is readable, the selected weapon state is visible without a tutorial overlay, and the first enemy no longer punishes the player before they can understand the weapon.

Combat is the biggest improvement. Hit stop, contact sparks, enemy knockback, and short stun make attacks feel like they connect. Enemy HP also creates a better rhythm because every attack is not just an instant delete. The gun and sword now have clearer separate identities.

The mixed art direction is no longer the main blocker. The restored background still looks more polished than the foreground, but the color-grade pass, foreground outlines, and character shadows make the contrast look more intentional. It reads as a stylistic prototype rather than a broken asset mix.

The remaining gap to a commercial-feeling 95+ score is not concept, but production volume. The fox still needs a true authored frame sheet for every state, and each stage needs more bespoke set pieces. The prototype now has the right direction and enough feel to justify that larger art pass.

## Remaining Improvements

Priority 1: True sprite-sheet production

Replace procedural fox poses with authored frame sets for idle, run, turn, brake, jump, fall, land, pickup, sword combo, gun recoil, hurt, and clear. The current procedural animation is acceptable for prototype feel, but a premium side-scroller needs authored silhouettes.

Priority 2: Enemy-specific attacks

Give each enemy one readable attack or threat pattern: beetle charge, slime hop, drone dive/shot, pod roll bounce. Current enemies have improved reactions but still mostly serve as moving collision bodies.

Priority 3: Stage set pieces

Add two or three memorable Stage 1 moments: a sword-only close-range lane, a gun-introduction flying target section, and a mixed enemy room before the goal.

Priority 4: Audio layering

Add separate pickup, sword-hit, gun-hit, enemy-hurt, enemy-defeat, landing, and weapon-switch sounds. Current sound is good enough for prototype review, but repeated play will expose the limited palette.

Priority 5: Source cleanup after art direction lock

Remove old unreachable smooth character rendering helpers and keep only the chosen pixel/rendering path. This will reduce future animation-change risk.

## Verification

- `node --check /mnt/c/Users/minou/fox-side-scroller/src/main.js`
- Playwright desktop check at `http://127.0.0.1:4174/`
- Playwright mobile reduced-motion check at `http://127.0.0.1:4174/`
- Desktop screenshot: `/tmp/fox-90-tuned.png`
- Mobile reduced-motion screenshot: `/tmp/fox-90-mobile-reduce-start.png`

## GitHub / Docs Mapping

- GitHub Issue: not_applicable, local-only prototype request and no target repository/remote was specified.
- Commit: not_applicable, no commit requested.
- PR: not_applicable, no remote publication requested.
- Design doc: `/mnt/c/Users/minou/fox-side-scroller/docs/side-scroller-design.md`
- Previous review doc: `/mnt/c/Users/minou/fox-side-scroller/docs/persona-review-2026-04-24.md`
- Follow-up review doc: `/mnt/c/Users/minou/fox-side-scroller/docs/persona-review-2026-04-25.md`
