# TODO

- add multiplayer
- bake lighting into maps, and add alpha channel for radial glows etc.
- Add damage zones/platforms
> Use for dying offscreen
> Use in the map as reddish pulsing damaging platforms
- Add healing zones/platforms
> Use in the map as greenish pulsing damaging platforms
- Whenever a player moves, their z-index/rendering order should be on top
> so dead players that just happen to be last don't get rendered on top of
> other players.
- Combo text somewhere (maybe text particle)
- Kill Buffs (killBuff(): void) to Player interface + Default
- Custom color selection for players
> Min V (HSV) for a player color = 0.4 (when they get to custom select colors)
- Particles (moving, jump, ground pound, attk, etc.)
- Sounds
- Upgrade System
> Default: either choose up to +30% crit chance or up to -15% attack cooldown.

## Classes
- tank:
> turns into circle with special (can turn back with special, the special has the same cooldown in both forms and doesnt affect attack)
> attacks in circle form stop the circle and have a large cooldown
> circle = larger
> rolls people (rolling deals lots of damage and kb, but it is hard to stop when you start going)
> cant jump in circle form
> can ground pound in square form
> in square form, the normal attack is
- ninja:
> attacks with slashes, proportional and direction based on speed
> slashes end with 0 velocity
> slashes can be used as movement (jump up, at immediately after jumping slash to go farther up etc.)
> add cool polargeist effect on slashes
> turns invisible with special, can heal 100% damage dealt per attack it lands while invisible
- berserk
> can ground pound
> attacks using an axe that sweeps in a circle (starts in the direction of the closest player and then rotates full 360 degrees over time starting fast ending slow) theoretically can hit the same person twice, kb is dependant on the axe velocity and direction
> special is 2 attacks at once, launches themselves and their opponent in the air vertically (with damage), then launch them horizontally with more damage and knockback (not a lot of knockback), opponents cannot escape or retaliate this unless they dodge the special which has a short range, right after the special they should be able to land an attack fast and groundpound their opponent
- menace:
> tanky
> attacks with a fist
> by default has a gauntlet
> uses special to throw the gauntlet as a projectile
> if it falls of the map it reclaims it automatically
> throwing and reclaiming gauntlet resets reload time
> guantlet throws based on the player velocity, also if it hits a player or something it will deal damage, apply knockback, and fall to the ground
> guantlet probably going to be gold (and custom texture), and fist is the player color and solid (and smaller)
> reclaiming guantlet gives menace 25% of its missing health back
> with gauntlet punches deals more damage has lower reload speed
> without guantlet punches deal less damage, but there is a higher reload speed, higher speed, and higher jump
> punches have low range and require moving the fist outward at the closest target
> punches can hit multiple if they're all grouped together
> no ground pound
> guantlet is a part of it, if it dies, the guantlet dies (whether its being worn or is on the ground)
- windy class (summon wind)
- summoning class (summon minions)

...

- Add camera (update vertex shader)
> I have no idea if I still want a camera
- jsx animations? (or for something else)
