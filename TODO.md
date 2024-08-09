# TODO

- Add basic lighting/shadows (players should have them too)
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
> Default: either choose up to +50% crit chance or up to -25% attack cooldown.

...

- Add camera (update vertex shader)
> I have no idea if I still want a camera
- jsx animations? (or for something else)
