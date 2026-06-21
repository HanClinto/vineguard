# Vineguard

_A fast-paced local multiplayer cooperative PvE harvest-and-defense action platformer with party-game pressure and light competitive stats._

> "Catch the foxes for us, the little foxes that spoil the vineyards, for our vineyards are in blossom." - Song of Solomon 2:15

Players protect a vineyard, harvest ripe grape clusters, carry them to a central winepress, and alternate jumps on pump platforms to fill the juice jar before foxes steal the crop.

## Design Spec / Prompt

My full design spec / prompt is [located here](spec.md) -- both if you want to read more of the game design, as well as how I tend to arrange my prompts.

## Play Online

Official deployment is hosted here on Github Pages:

hanclinto.github.io/vineguard/

## Play Locally

Can also download and run locally if you like:

```sh
npm run serve
```

Then open http://localhost:8000/.

## Controls

- Player 1: Arrow keys
- Player 2: WASD
- Player 3: YGHJ
- Player 4: PL;'

Press any key from an unused control set to join.

## Deploy

The project is configured to deploy to GitHub Pages from GitHub Actions when changes are pushed to the `master` branch.

## Development

```sh
npm run check
```

The project intentionally uses no build step. Source files are plain JavaScript modules loaded directly by the browser.

## Credits

Vibe-coded in Github Copilot using GPT 5.5.

[Character](https://elthen.itch.io/pixel-art-adventurer-sprites), [fox](https://elthen.itch.io/2d-pixel-art-fox-sprites), and forest pixel art sprites are by Elthen and used under [Elthen's Common Sense License 1.0](https://www.patreon.com/elthen/posts/licensing-27430241).