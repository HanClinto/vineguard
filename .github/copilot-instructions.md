# Vineguard Implementation Instructions

Use these instructions when implementing Vineguard.

## Product Direction

Vineguard is a one-screen local couch co-op arcade game for a Christian-themed game jam. The central verse is Song of Solomon 2:15. The game should feel joyful, communal, readable, and family-friendly.

The target is a one-week jam build, not a large engine project. Prefer a small no-build HTML, JavaScript, and Canvas implementation that can run on GitHub Pages.

Do not implement online multiplayer unless explicitly requested. Local keyboard and optional browser Gamepad API support are the intended multiplayer model.

## Scope Priorities

Prioritize the playable core loop over breadth:

1. Four local players on one screen.
2. Simple platformer movement.
3. Grapes grow, ripen, and can be carried one cluster at a time.
4. A central winepress accepts one grape cluster and uses two jump-activated pump platforms.
5. Foxes steal grapes and flee when players approach.
6. Filling the juice jar completes the round.
7. Later rounds increase grapes, foxes, and juice goal.

Ravens, AI helpers, multiple maps, controller calibration, and elaborate awards are deferred unless the core loop is already fun.

The project should deploy to GitHub Pages on push to the `master` branch.

## Code Style

Keep code straightforward enough for advanced middle-schoolers to follow.

Prefer plain JavaScript modules or clearly separated script files. Avoid build tooling unless the user asks for it. Avoid large dependencies.

Separate concerns where practical:

- Main loop and timing
- Canvas rendering
- Input handling
- Player physics
- Grape and vineyard state
- Fox behavior
- Winepress behavior
- Round progression and scoring

Do not add unnecessary abstractions. Favor small functions with direct names and obvious data structures.

## Gameplay Rules To Preserve

Players scare foxes away by proximity or collision. Do not require an attack button for the first implementation.

Blossoms cannot be stolen or harvested. Unripe fruit can only be stolen by foxes. Ripe fruit can be both stolen by foxes and harvested by players.

Players can carry only one grape cluster. If the winepress vat is occupied, a player keeps carrying their grapes rather than dropping them.

The winepress pump is social: standing on a pump platform should not press juice. A pump stroke happens when a player lands on a pump platform from the air. Pressing one side lowers it and raises the other side. Two players alternating jumps should outperform one player jumping back and forth.

Mixed skill support matters. Make simple contributions useful, especially guarding the center and operating the pump. Missed jumps should cost time, not remove players from play.

## Readability Requirements

Make important state obvious without relying on active-play tutorial text:

- Ripe grapes need a clear sprite state plus sparkle, pulse, or particle feedback.
- Highlight the vat when a grape-carrying player can deposit.
- Highlight the pump platforms when the vat is loaded and ready to press.
- Make fox targets and fox escape behavior readable.
- Show juice progress clearly.

Use low-res pixel-style graphics, simple shapes, or placeholder art if needed, but keep all gameplay states visually distinct.

## Verification

Before calling work complete, run the game locally in a browser when possible and test what can be tested from an agentic test harness. Use browser automation, screenshots, and direct game-state checks where practical.

Verify:

- At least two keyboard players can join and move.
- Blossoms cannot be stolen or harvested.
- Unripe fruit can be stolen but cannot be harvested.
- Ripe fruit can be both stolen and harvested.
- Grapes become ripe and can be delivered.
- The winepress requires landing-based pump strokes.
- Foxes can steal grapes, escape with them, and be scared into dropping them.
- A round can be won by filling the juice jar.

If browser or harness verification is not possible, state what was not verified.