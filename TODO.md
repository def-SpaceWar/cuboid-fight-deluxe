# TODO

- add wall-jumping (default will get wall jumping, just not the best)
> lightweight kits get this
> add isOnWall boolean to Player and add conditions to jump function
> wallJumpDirection variable to store which direction to jump
> on a wall the jump should launch away from wall
- add online multiplayer
> sync end screens (done)
> make continue go back to lobby
> add player customization in lobby (add multiple players)
> get it to work with 3+ clients
> make forming lobbies more convenient, and handle disconnects
- Particles (moving, jump, ground pound, attk, etc.)
- Combo text somewhere (maybe text particle)
- Custom color selection for players
> Min V (HSV) for a player color = 0.4 (when they get to custom select colors)
- Sounds
- Kill Buffs (killBuff(): void) to Player interface + Default
- Upgrade System
> Default: either choose +20% crit chance losing 20 max hp or lose 1 jump but
  heal 30% of missing health every 8 seconds.
- bake lighting into maps, and add alpha channel for radial glows etc.
- Add damage zones/platforms (done), moving platforms
> Use for dying offscreen (done)
> Use in the map as reddish pulsing (not pulsing and doesn't have texture yet)
  damaging platforms.
- Add healing zones/platforms (probably another map)
> Use in the map as greenish pulsing damaging platforms
- Save Replay functionality (map: map, inputs: {tick: input}, players: [...]}
> let user download the file or save it to localStorage figure it out

## Classes

- tank:
> turns into circle with special (can turn back with special, the special has
  the same cooldown in both forms and doesnt affect attack)
> attacks in circle form stop the circle and have a large cooldown
> circle = larger
> rolls people (rolling deals lots of damage and kb, but it is hard to stop
  when you start going)
> cant jump in circle form
> can ground pound in square form
> in square form, the normal attack is
- ninja:
> attacks with slashes, proportional to speed and direction based on speed
> slashes end with 0 velocity
> slashes can be used as movement (jump up, at immediately after jumping slash
  to go farther up etc.)
> add cool polargeist effect on slashes
> turns invisible with special, can heal 100% damage dealt per attack it lands
  while invisible
- berserk
> can ground pound
> attacks using an axe that sweeps in a circle (starts in the direction of the
  closest player and then rotates full 360 degrees over time starting fast
  ending slow) theoretically can hit the same person twice, kb is dependant on
  the axe velocity and direction + distance from player (aka axe radius)
> special is 2 attacks at once, launches themselves and their opponent in the
  air vertically (with damage), then launch them horizontally with more damage
  and knockback (not a lot of knockback), opponents cannot escape or retaliate
  this unless they dodge the special which has a short range, right after the
  special they should be able to land an attack fast and groundpound their
  opponent
- menace:
> tanky
> attacks with a fist
> by default has a gauntlet
> uses special to throw the gauntlet as a projectile
> if it falls of the map it reclaims it automatically
> throwing and reclaiming gauntlet resets reload time
> guantlet throws based on the player velocity, also if it hits a player or
  something it will deal damage, apply knockback, and fall to the ground
> guantlet probably going to be gold (and custom texture), and fist is the
  player color and solid (and smaller)
> reclaiming guantlet gives menace 25% of its missing health back
> with gauntlet punches deals more damage has lower reload speed
> without guantlet punches deal less damage, but there is a higher reload
  speed, higher speed, and higher jump
> punches have low range and require moving the fist outward at the closest
  target
> punches can hit multiple if they're all grouped together
> no ground pound
> guantlet is a part of it, if it dies, the guantlet dies (whether its being
  worn or is on the ground)
- windy class (summon wind)
- summoning class (summon minions)
- heavyweight
> charge up attack (hold attack down) let go to attack
> special is a taunt that heals 30% missing health and deals kb (no damage and
  big range.
> no wall jump
> slow, high health, low jumps (faithful to cuboid fight remade)
- double trouble
> 2 people, swap by using special
> each has their own unique melee attack
> share healthbar
> one is high mobility other is low mobility

...

- Add camera (update vertex shader)
> I have no idea if I still want a camera
- jsx animations? (or for something else)
