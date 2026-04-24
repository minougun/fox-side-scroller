# Publication Handoff

Date: 2026-04-25

## Scope

Publish the local browser game prototype so acquaintances can play it if they know the URL.

## Accessed Work

- Local project: `/mnt/c/Users/minou/fox-side-scroller/`
- Local URL: `http://127.0.0.1:4174/`
- GitHub repository: `https://github.com/minougun/fox-side-scroller`
- GitHub Pages URL: `https://minougun.github.io/fox-side-scroller/`

## Privacy Model

The game is published as a public static GitHub Pages site. This is not access-controlled. Anyone with the URL can play, and the repository can also be found publicly on GitHub.

No authentication, personal data collection, backend API, database, or paid service is used.

## Security / Data Check

- Static files only: HTML, CSS, JavaScript, PNG assets, and docs.
- No `.env` files are included in the project.
- Secret keyword scan was run before publication and found no project-local secret hits.
- GitHub Pages serves only static files, so there are no server-side mutation endpoints, auth bypass paths, or database write paths to test.
- Live GitHub Pages smoke test passed at `https://minougun.github.io/fox-side-scroller/`.

## 2026-04-25 Production Update

- The production push request adds a pre-start difficulty selector: Easy, Normal, and Hard.
- Difficulty changes enemy count and motion profile. Easy trims enemies and slows motion; Hard adds extra enemies and increases movement/HP pressure.
- The same production update includes the `1-1` through `3-3` session structure, per-session key gates, and mobile touch-control improvements.
- No backend, authentication, database, private API, or paid service was added, so API direct-call and browser-direct-DB bypass checks are not applicable.

## GitHub / Docs Mapping

- GitHub Issue: not_applicable, direct production push was requested without issue workflow.
- Commit: `2d7e252` initial publication commit, plus follow-up commits including the production difficulty/session update recorded in the final completion report.
- PR: not_applicable, direct publication to `main` was requested.
- Design doc: `/mnt/c/Users/minou/fox-side-scroller/docs/side-scroller-design.md`
- Publication doc: `/mnt/c/Users/minou/fox-side-scroller/docs/publication-2026-04-25.md`
