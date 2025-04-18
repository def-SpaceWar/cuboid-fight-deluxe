# TODO

- Subclasses System
> Default: either choose +20% crit chance losing 20 max hp or lose 1 jump but
  heal 30% of missing health every 4 seconds. Lose 50% damage but attack with
  poison for 5% every 1 second for 5 seconds (27% HP over 5 seconds).
> Default:
> Precise Default:
> Persistent Default:
> Poisonous Default:
- Particles (moving, jump, ground pound, attk, etc.)
- Combo text somewhere (maybe text particle)
- add +1 kill or -1 life text (just add more texts)
- add online multiplayer
> add controls to lobby
> customize gamemode (and display it on clients)
> make forming lobbies more convenient, and handle disconnects
- Add moving platforms (all platforms must save state too)
- make animated textures for platforms
> death platform can be veiny with red pulsing through it
> (it would look very cool)
- Sounds
> sync them exactly how the particles are synced up
- Add healing zones/platforms (probably another map)
> Use in the map as greenish pulsing damaging platforms
- Save Replay functionality (map: map, inputs: {tick: input}, players: [...]}
> let user download the file or save it to localStorage figure it out
- Add camera (update vertex shader)
> I have no idea if I still want a camera
> Camera's only on certain maps (larger maps)

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
> attack = cone shaped gust of wind at the nearest player
> massive range
> low damage
> special does pure knockback in a larger radius and heals
> low health mobility
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
- summoning class (summon minions)
> hell no not yet
...

- jsx animations? (or for something else)
