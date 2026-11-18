# Global Watch

Live open-source monitor of conflict, nuclear, cyber, AI and natural-hazard activity.

- `site/` is the static site published to GitHub Pages.
- `scripts/fetch.mjs` pulls the public feeds and writes `site/data/live.json`.
- `.github/workflows/update.yml` runs the fetch and redeploys about every 15 minutes.
- `site/data/assessed.json` holds the hand-checked events and threat ratings; edit it to update them.

Headlines are unverified and placed on the map automatically from place names in the headline text.
