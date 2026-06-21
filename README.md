# Vineguard

Vineguard is a one-screen local couch co-op arcade game prototype inspired by Song of Solomon 2:15.

Players protect a vineyard, harvest ripe grape clusters, carry them to a central winepress, and alternate jumps on pump platforms to fill the juice jar before foxes steal the crop.

## Play Locally

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

Character, fox, and forest pixel art sprites are by Elthen and used under Elthen's Common Sense License 1.0. Credit is optional under the license, but appreciated by the artist.

The included Elthen asset files are part of this game project and are not offered as standalone reusable asset packs. See the original license for full terms, including restrictions around redistribution, blockchain/crypto projects, and AI training.

License reference: https://www.patreon.com/elthen/posts/licensing-27430241