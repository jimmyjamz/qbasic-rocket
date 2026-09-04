# RKT-73 — Sneakle Cheetos trade for Flux Capacitor repair part

RKT-73 starts the next Sneakle repair beat after the Wobble Coil is installed.

## Player flow

```text
Rocket theft tosses backpack from rocket
→ install Wobble Coil
→ objective becomes FIND BACKPACK
→ recover backpack containing Cheetos
→ objective becomes TRADE CHEETOS
→ weird helpful alien accepts Cheetos
→ alien gives Icky Sticky Slime plus Flux Capacitor
→ objective becomes FLUX CAPACITOR FOUND
```

## Design notes

- The backpack exists because the rocket thieves tossed it out the window during the theft.
- Cheetos are the item the alien wants.
- The alien is helpful but weird, not hostile.
- The trade payoff is intentionally silly: Icky Sticky Slime and the Flux Capacitor.
- The UFO does not fly yet in this slice.

## Guardrails

- No combat, damage, health, lives, or weapons.
- No full inventory UI yet.
- No full quest graph.
- No UFO flight or stolen rocket recovery yet.
- Keep the flow kid-readable and funny.

## Fast test URL

```text
http://localhost:5173/?testPlanet=sneakle&testStage=hatch
```

## Validation path

1. Inspect hatch panel.
2. Collect and install the Wobble Coil.
3. Confirm objective becomes `FIND BACKPACK`.
4. Move left and collect the backpack/Cheetos.
5. Confirm objective becomes `TRADE CHEETOS`.
6. Return right to the weird helpful alien.
7. Confirm objective becomes `FLUX CAPACITOR FOUND`.

## Deferred

- Flux Capacitor installation.
- Using Icky Sticky Slime as an interaction/tool.
- UFO launch/warp.
- Returning to recover the stolen rocket.
