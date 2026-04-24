# Persona Review: Fox Side Scroller

Date: 2026-04-24

## Accessed Work

- Local project: `/mnt/c/Users/minou/fox-side-scroller/`
- Browser URL: `http://127.0.0.1:4174/`
- Main source: `/mnt/c/Users/minou/fox-side-scroller/src/main.js`
- Design handoff: `/mnt/c/Users/minou/fox-side-scroller/docs/side-scroller-design.md`

## Persona

Name: Kenta

Profile: 34-year-old console and PC player who grew up with SFC action games, later became a fan of arcade-style 2D games with dense animation, heavy hit reactions, and readable pixel art. He tries indie action demos on itch.io and Steam Next Fest, but drops prototypes quickly when controls, hit feedback, or art direction feel unclear.

Main expectations:

- The character must read instantly as a fox, even while moving.
- Pixel art should feel deliberately authored, not just low-resolution.
- Attacks need hit stop, impact, recoil, enemy reactions, and clear damage confirmation.
- Stage layouts should teach mechanics through placement, not text.
- The first minute should prove that the core action has a satisfying feel.

## Score

Overall score: 68 / 100

Breakdown:

- Character appeal and fox readability: 14 / 20
- Action feel and combat feedback: 15 / 20
- Pixel-art direction and animation density: 12 / 20
- Stage design and onboarding: 12 / 20
- Weapon/progression clarity: 9 / 10
- Audio and mood: 6 / 10

## Harsh Review

The prototype is playable and the fox now reads much better than before, especially with the corrected snout and tail. The weapon pickups are also a good direction because they make the stage itself part of the progression.

The biggest weakness is still art direction consistency. Restoring the original background improves the atmosphere, but it also makes the foreground sprites look less finished by comparison. The background feels like a polished illustration, while the character and enemies feel like a promising placeholder pass. This can work as a deliberate "pixel characters over painterly backgrounds" style, but the palette, outlines, shadow treatment, and resolution rules need to be unified.

Combat is functional but not yet memorable. The sword and gun are usable, explosions exist, and screen shake helps, but enemy damage reactions are still too similar across enemy types. A Metal Slug-like feel needs stronger per-frame commitment: hit stop, enemy squash, recoil, sparks, smoke trails, debris timing, and different defeat silhouettes.

The stage is longer now, but length alone does not yet create rhythm. The first stage needs a clearer arc: safe movement, first pickup, forced but fair use of that pickup, a small mastery check, and then a variation. Right now it is closer to a long test course than a composed first level.

## Improvement List

Priority 1: Unify the art direction

Choose one intentional look and enforce it. If keeping the restored smooth background, add a shared color grade, bolder foreground silhouettes, and pixel-compatible shadow bands so the sprites feel planted in the scene. If moving fully SFC-style, repaint the background as true tile/pixel art rather than downsampled illustration.

Priority 2: Add stronger hit feel

Add 3-6 frames of hit stop on sword hits, enemy-specific hurt poses, knockback arcs, impact sparks at the contact point, and stronger projectile impact bursts. This is the most important path to the requested arcade-quality feel.

Priority 3: Expand the fox animation sheet behavior

Add distinct start-run, stop, turn, landing, pickup, sword windup, sword recovery, gun recoil, hurt, and ledge-fall poses. The current motion reads, but it does not yet have the dense authored frame language expected from the reference target.

Priority 4: Improve weapon pickup teaching

Place the first sword where it is impossible to miss, then immediately place a low-risk enemy that is easiest to defeat with the sword. Do the same for the gun with a flying or ranged enemy. The player should understand weapon value without reading instructions.

Priority 5: Compose stage rhythm

Break Stage 1 into readable beats: intro movement, sword tutorial, fruit route, gun tutorial, mixed enemy room, short vertical section, checkpoint, final rush, goal. Longer stage width should be used for rhythm, not just distance.

Priority 6: Make enemy silhouettes more premium

Give each enemy a stronger body shape, idle cycle, attack warning pose, hurt frame, and defeat debris profile. The current enemy graphics are readable, but they still lack the personality needed for a commercial-feeling side-scroller.

Priority 7: Tighten UI feedback without adding instruction clutter

Show collected weapons and selected weapon clearly in the HUD with small icons. Avoid adding a large operation guide in-game, but make current capability obvious.

Priority 8: Clean up source once direction stabilizes

Remove unreachable old smooth character drawing code and any unused rendering helpers after the visual direction is locked. This will make later animation and combat changes less fragile.

Priority 9: Upgrade sound response

The generated BGM establishes mood, but combat needs sharper SFX: sword slash, hit confirm, gun shot, pickup, enemy burst, landing, and hurt. These should be short, layered, and timed to animation frames.

## Verification

- `node --check /mnt/c/Users/minou/fox-side-scroller/src/main.js`
- `curl -I http://127.0.0.1:4174/`
- Playwright load and screenshot check at `http://127.0.0.1:4174/`
- Screenshot output: `/tmp/fox-bg-restored-play.png`

## GitHub / Docs Mapping

- GitHub Issue: not_applicable, local-only prototype request and no target repository/remote was specified.
- Commit: not_applicable, no commit requested.
- PR: not_applicable, no remote publication requested.
- Design doc: `/mnt/c/Users/minou/fox-side-scroller/docs/side-scroller-design.md`
- Review doc: `/mnt/c/Users/minou/fox-side-scroller/docs/persona-review-2026-04-24.md`
