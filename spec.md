# Vineguard

_A fast-paced local multiplayer cooperative PvE harvest-and-defense action platformer with party-game pressure and light competitive stats._

> "Catch the foxes for us, the little foxes that spoil the vineyards, for our vineyards are in blossom." - Song of Solomon 2:15

> And he told them many things in parables, saying: "A sower went out to sow. And as he sowed, some seeds fell along the path, and the birds came and devoured them." - Matthew 13:3-4

> "And they went out into the field and gathered the grapes from their vineyards and trod them and held a festival..." - Judges 9:27a

> "Let us go out early to the vineyards and see whether the vines have budded, whether the grape blossoms have opened and whether the pomegranates are in bloom." - Song of Solomon 7:12

> "They shall build houses and inhabit them; they shall plant vineyards and eat their fruit." - Isaiah 65:21

## Design Pillars

- Local couch co-op first. No online multiplayer.
- Easy for mixed skill levels to play together.
- One-screen arcade-cabinet feel.
- Cooperation first, with playful individual stats and local high scores after runs.
- Social, readable action: players should quickly understand what needs help.
- Simple controls, no attack button required.
- No-build HTML, JavaScript, and Canvas, deployable on GitHub Pages.
- Code should be straightforward enough for advanced middle-schoolers to understand.

## Theology of Games

So many things that God gave us have both holy and unholy uses. It is interesting that gluttony is one of the seven deadly sins, yet there are prescribed feasts for the people of God, and Holy Communion is one of the ways God provides His grace to us.

So if we are "wired for food", yet food has both holy and unholy uses, then we ask: what did God have in mind when He wired us for games?

We believe games are at their best when they draw people and families together, and games are at their worst when they draw people and families apart.

Vineguard should feel like a joyful, communal game about protecting what is growing, gathering the harvest, and celebrating shared work.

## Inspiration

- Killer Queen: local arcade energy, drop-in feel, one-screen readability.
- Overcooked: cooperative chaos, self-organizing roles, visible workstations.
- Ultimate Chicken Horse: approachable platforming and playful social friction.

## Target Scope

- Jam length: one week.
- Players: 1-4 local players.
- Balance target: 1 player can test and understand the loop, 2 players is minimum fun, 3 is adequate, 4 is best.
- Session length: roughly 15 minutes max unless players get an especially strong run.
- Run shape: starts calm, then escalates until the team is overwhelmed.
- Minimum satisfying version: one screen, four local players, foxes only, platformer movement, randomly spawning harvestable grapes, central see-saw winepress, escalating chaos, and local high scores.

## Core Game Loop

Players defend grape clusters as they grow in a vineyard during one continuous escalating run.

Grapes begin as blossoms, grow into fruit, and eventually ripen. Ripe grapes can be harvested by players, carried to the winepress, loaded into the vat, and pressed into juice.

Foxes enter the vineyard and try to steal grapes. Players scare foxes away by approaching them. A scared fox drops what it is carrying and flees.

The game ends when foxes have stolen too many grapes. The default stolen-grape limit is 10.

The score is the total juice pressed, tracked internally in milliliters. The in-game juice display may show liters for readability, while high scores show milliliters so small contributions still feel visible.

The team's local high score records the entered team name, juice score, player count, run time, and stolen grapes.

## Vineyard And Grapes

Grape clusters appear at random locations around the map, with margins from the screen edges and from the central winepress.

Each cluster has clear growth states:
- Blossom: cannot be harvested or stolen.
- Unripe fruit: cannot be harvested by players, but can be stolen by foxes. If stolen and dropped, it disappears.
- Ripe fruit: can be harvested by players and can be stolen by foxes. If stolen and dropped, it remains on the ground and can be picked up.

Ripe grapes should be visually obvious. Use a clear sprite state and a small particle effect, sparkle, pulse, or bounce when they become ready.

Players can carry only one grape cluster at a time.

When carrying grapes, a player can deposit them into the winepress only if the press vat is empty. If the vat is occupied, the player keeps carrying the grapes.

## Foxes

Foxes are the first and only required enemy type.

Fox behavior:

- Enter from random locations on the left or right edge of the screen.
- Choose a random target grape cluster.
- Run toward the target.
- Pick up the grapes if they reach the target.
- Carry the grapes back toward a screen edge.
- Escape with the grapes if they leave the screen.
- Drop carried grapes and flee if a player gets close enough.

Foxes should not need to be killed. Cartoon contact or scare effects are fine, but the main verb is "scare away" rather than "attack".

Ravens are a later expansion idea, not part of the first implementation target.

## Winepress

The winepress is the central social machine of the game.

It has:

- A central vat that holds one grape cluster at a time.
- A juice jar or meter showing current juice produced.
- Two piston platforms or pump handles, one on each side of the vat.

The two pump platforms work like a dual-pump railway handcar mechanism:

- Landing on one pump platform drives it down.
- Driving one side down raises the opposite side.
- Standing still on a pump platform is not enough to press.
- A player must be airborne and then land on the platform to cause a pump stroke.
- Each valid alternating pump stroke immediately adds juice in milliliters.
- A loaded grape cluster contains a finite amount of juice, so partial extractions still count toward the score.
- One player can operate both sides by jumping back and forth, but this should be slow.
- Two players alternating jumps should press much faster.
- Great timing should feel satisfying, but mediocre timing should still work.

The distance between pump platforms can tune how valuable teamwork is. Wider spacing makes solo pumping harder and tandem pumping more desirable.

## Readability And Guidance

The game should constantly but quietly show what needs attention.

Important readability cues:

- Ripe grapes should sparkle, pulse, or emit particles.
- When a player is carrying grapes and the press is empty, highlight the vat or show a clear deposit cue.
- When the vat is loaded and ready to press, highlight the pump platforms.
- Fox intent should be readable: players should be able to tell which grape cluster a fox is targeting or whether it is escaping with grapes.
- The juice jar should clearly show accumulated juice.
- Danger should be visible before failure feels sudden.

Avoid tutorial text during active play. Favor animation, color, particles, outlines, and simple icons.

## Player Roles And Mixed Skill

Vineguard should let players self-organize without formal classes.

Example roles that should naturally emerge:

- Pump operator: stays near the winepress and works the see-saw.
- Harvester: grabs ripe grapes and carries them to the press.
- Defender: chases foxes away from threatened vines.
- Runner: handles far vines and urgent recoveries.

Less confident players should be able to contribute by staying near the center, operating the pump, or guarding nearby grapes. More adventurous players can take on longer routes, fox recoveries, and multitasking.

Falling, missing a jump, or arriving late should cost time, not remove a player from the game.

## Controls

Supported players: 1-4 local players.

Preferred controls are simple platformer controls:

- Left
- Right
- Jump
- Down or special, only if needed

The first implementation should not require an attack button. Players scare foxes by proximity or collision.

Keyboard layouts to consider:

- Arrow keys
- WASD
- YGHJ
- PL;'

Players should be able to press any key from an unused valid control set to join.

Gamepads should be supported if practical through the browser Gamepad API. A simple "press any button to join" flow is ideal. Full controller calibration is optional and should not block the first playable version.

Keyboard ghosting should be tested early, because four players on one keyboard may not work reliably on every keyboard.

## Difficulty And Progression

The game is one continuous level that starts simple and gradually becomes more chaotic.

Difficulty increases over time by:

- Spawning grapes more quickly.
- Spawning foxes more quickly.
- Allowing more active grapes and foxes on screen.
- Making foxes faster or more coordinated.

Grape spawn rate and fox spawn rate should have separate tuning parameters so playtesters can try different escalation curves.

Do not increase difficulty automatically just because more players join. High scores should record the number of players.

The default run ends when foxes have stolen 10 grapes, but this should be tunable from debug controls.

## Stats And Awards

After a run, show team progress and playful individual contribution stats.

Stats should celebrate different kinds of contribution rather than shame weaker players.

Possible stats or awards:

- Bane of Foxes: scared away the most foxes.
- Champion Grape Stomper: contributed the most pump strokes.
- Chief Harvester: delivered the most grape clusters.
- Vineyard Guardian: saved the most threatened grapes.
- Long Hauler: delivered grapes from the farthest vines.
- Steady Hands: fewest dropped or interrupted deliveries, if tracked.

## Visual Style

Low-res pixel art, similar in spirit to Killer Queen.

Characters are small, readable humanoid avatars. Keep them simple and strongly color-coded.

Foxes are generic red foxes. They should read clearly as cute but troublesome vineyard pests.

The game should feel warm, festive, and communal rather than grim or violent.

## Bible Verse Presentation

Song of Solomon 2:15 is the central verse.

Verses may appear on the main screen as rotating decorative flavor text.

The game mechanics should carry the theme more than in-game text does. Active play should remain readable and uncluttered.

## Framework And Code Expectations

No-build HTML, JavaScript, and Canvas is ideal. The game should run on GitHub Pages.

The project should deploy to GitHub Pages when changes are pushed to the `master` branch.

Keep the code simple, modular, and understandable. Clear separation is preferred for:

- Main loop and timing
- Rendering
- Input handling
- Player movement
- Grapes and vineyard state
- Fox behavior
- Winepress behavior
- Continuous progression and scoring

Avoid overengineering. Prefer direct, readable game logic over frameworks unless a tiny helper library becomes clearly worthwhile.

## Implementation Priorities

Build in this order:

1. Single-screen Canvas map with fixed dimensions and responsive scaling.
2. Local player join and keyboard input.
3. Platformer movement and collision.
4. Grape growth states and harvesting.
5. Winepress deposit and two-sided pump interaction.
6. Milliliter-based juice scoring and stolen-grape game over.
7. Fox targeting, stealing, escaping, and scare-away behavior.
8. Continuous spawn-rate progression, high scores, and debug tuning controls.
9. Gamepad support.
10. Polish: particles, highlights, animations, sound, title screen, high scores.

## Testing And Verification

Test whatever can reasonably be tested from an agentic browser harness.

Important flows to verify:

- Players can join with keyboard controls.
- At least two players can move and jump independently.
- Blossoms cannot be stolen or harvested.
- Unripe fruit can be stolen by foxes but cannot be harvested by players.
- Ripe fruit can be both harvested by players and stolen by foxes.
- Ripe grapes can be deposited into the empty winepress vat.
- If the vat is occupied, a player keeps carrying their grapes.
- Pump strokes require landing on a pump platform from the air.
- Alternating pump strokes add milliliters immediately.
- Foxes drop stolen ripe grapes when scared and can escape with grapes if not stopped.
- The game ends when foxes reach the stolen-grape limit.
- Local high-score entry stores the team name and score.

Use browser automation, screenshots, and direct game-state checks where practical. If something cannot be verified automatically, record what was manually checked or left unverified.

## Deferred Ideas

- Ravens that attack from above.
- More maps.
- More vineyard hazards.
- AI helper for solo players.
- Full gamepad calibration.
- More elaborate awards.

