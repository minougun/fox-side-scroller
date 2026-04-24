# Rights Review

Date: 2026-04-25

## Scope

- Project: `/mnt/c/Users/minou/fox-side-scroller/`
- GitHub repository: `https://github.com/minougun/fox-side-scroller`
- GitHub Pages URL: `https://minougun.github.io/fox-side-scroller/`
- User design reference checked: `/mnt/c/Users/minou/DESIGN.md`
- Game design handoff: `/mnt/c/Users/minou/fox-side-scroller/docs/side-scroller-design.md`

## Sources Checked

- Vercel brand guidelines: `https://vercel.com/geist/brands`
- Vercel trademark policy: `https://vercel.com/legal/trademark-policy`
- Geist font repository/license: `https://github.com/vercel/geist-font`

## Findings

- `/mnt/c/Users/minou/DESIGN.md` is an analysis of a Vercel-inspired visual system, including Vercel marks, Geist typography, monochrome layout rules, and Vercel-like component styling.
- Vercel's brand guidance says the Vercel trademark includes the Vercel name/logo and designations identifying Vercel products, and warns against confusing uses or suggesting sponsorship/endorsement.
- The Geist font repository states that Geist is licensed under the SIL Open Font License 1.1, but the font license does not grant permission to use Vercel trademarks or make a product look endorsed by Vercel.
- The current game does not use Vercel logos, the Vercel name, Next.js/v0/Turbo marks, Vercel product names, Geist font files, or a Vercel-like white developer-infrastructure UI.
- Current game assets are project-local/generated/procedural: canvas-drawn fox/enemies/effects, generated panorama, and runtime WebAudio music.

## Risk Assessment

Current implementation risk is low for Vercel-specific rights issues because the shipped game aesthetic is a pixel-art fox action game rather than a Vercel-branded or Vercel-lookalike product UI.

Risk would increase if future work copies Vercel's marks, names, exact layouts, Geist assets without preserving license terms, or marketing language that implies Vercel sponsorship. Avoid using `/mnt/c/Users/minou/DESIGN.md` as a direct implementation spec for this game unless the result is generalized and visibly distinct from Vercel branding.

This is an engineering/product rights review, not legal advice.

## GitHub / Docs Mapping

- GitHub Issue: not_applicable, no issue creation requested for this local change.
- Commit: not_applicable, no commit requested.
- PR: not_applicable, no publication requested.
- Related design doc: `/mnt/c/Users/minou/fox-side-scroller/docs/side-scroller-design.md`
- Rights review doc: `/mnt/c/Users/minou/fox-side-scroller/docs/rights-review-2026-04-25.md`
