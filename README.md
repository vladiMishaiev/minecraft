# כורי האותיות ⛏️ — Letter Miner

A first-person 3D voxel game where the player mines English letter-blocks and
assembles animal names. Built for a 3rd-grade English class assignment, with
the 9-year-old daughter leading design decisions in live pair sessions.

**Live game:** https://vladimishaiev.github.io/minecraft/  
**Assignment deadline:** 2026-06-10  
**Teacher:** Adia (3rd grade)

---

## Table of Contents

1. [Project Context](#1-project-context)
2. [Quick Start](#2-quick-start)
3. [Game Mechanics](#3-game-mechanics)
4. [Architecture Overview](#4-architecture-overview)
5. [File-by-File Reference](#5-file-by-file-reference)
6. [Key Technical Details](#6-key-technical-details)
7. [Word List & Animals](#7-word-list--animals)
8. [Known Quirks & Past Fixes](#8-known-quirks--past-fixes)
9. [Deployment](#9-deployment)
10. [Rubric Checklist](#10-rubric-checklist)
11. [Future Ideas (Daughter's Wish List)](#11-future-ideas-daughters-wish-list)

---

## 1. Project Context

- **Who:** Vlad's daughter (age 9). Household language: Hebrew. She is the
  creative director — Vlad translates her ideas into prompts during live pair
  sessions.
- **What:** A Minecraft-feel 3D world. Mine letter blocks → assemble animal
  names in order → celebrate with animation.
- **Stack:** Vite 5 + plain JavaScript (no TypeScript) + Three.js r160.
  No backend, no persistence, no build-time assets (all textures are generated
  at runtime via Canvas API).
- **Rubric items (1–4 each):**
  1. Game playability
  2. Game instructions (Hebrew UI)
  3. Letter coverage — all 26 appear
  4. Letter practice — each letter with an example word
  5. Word assembly — 3-letter word building
  6. Readability & design
  7. On-time submission

---

## 2. Quick Start

```bash
# Install dependencies (first time only)
make install          # or: npm install

# Development server (opens browser, hot-reload)
make dev              # or: npm run dev

# Verify build (no syntax/import errors)
make check            # or: npm run build

# Preview production build locally
make preview

# Clean build artefacts
make clean
```

The Makefile wraps all npm scripts. `make help` lists every target.

---

## 3. Game Mechanics

### Core loop

1. **Explore** the island (first-person, WASD + mouse-look / touch joystick).
2. **Aim** the crosshair at a letter block (it glows yellow when targeted).
3. **Mine** it with left-click (desktop) or the ⛏️ button (mobile).
4. The letter is added to inventory **only if** the current target word needs it.
5. The **word-progress bar** (bottom-center) shows lit slots for collected letters.
6. When all letters for the current word are collected, a celebration animation
   fires (emoji + word + "כל הכבוד! 🎉"), letters are removed from inventory,
   and the next word becomes active.
7. Words advance in order (DOG → CAT → BUNNY → … → AXOLOTL).
8. The **quest panel** (left side) shows the full word list with ✓ / ▶ markers.

### Controls — Desktop

| Action | Input |
|---|---|
| Move | WASD or Arrow keys |
| Look | Mouse (pointer-lock) |
| Jump | Space |
| Mine | Left-click |
| Pause | Esc |

### Controls — Mobile (auto-detected)

| Action | Input |
|---|---|
| Move | Drag left half of screen (virtual joystick) |
| Look | Drag right half of screen |
| Jump | ↑ button (bottom-right) |
| Mine | ⛏️ button (bottom-right) |
| Pause | ⏸ button (top-right) |

Mobile is detected via `'ontouchstart' in window || navigator.maxTouchPoints > 0`.

### Block respawn

Mined blocks turn invisible and respawn after 2.5 s with a scale-up tween
(cubic ease-out, 350 ms). They never permanently disappear, so all 26 letters
are always reachable.

---

## 4. Architecture Overview

```
index.html          Hebrew start screen + canvas mount point
src/
  main.js           Scene setup, render loop, event wiring
  world.js          Island geometry + letter block placement + trees + eating spots
  textures.js       CanvasTexture generators (cached, generated at runtime)
  controls.js       Desktop (PointerLockControls) + Mobile (touch) — shared collision
  mining.js         Raycaster targeting + mine action + block respawn
  inventory.js      Letter inventory state (Map-based, duplicate-aware)
  quest.js          Word list, letter-slot progress bar, completion/celebration logic
  words.js          Ordered list of animal words + emojis
  animals.js        Land animals (wander AI) + sea animals (orbital AI)
  audio.js          Web Speech API — says letter name then phonetic sound on mine
  style.css         All UI styles, including mobile responsive overrides
.github/
  workflows/
    deploy.yml      GitHub Actions → GitHub Pages CI/CD
Makefile            Convenience wrappers for npm scripts
```

### Data flow

```
User mines block
  → mining.js: mine()
      → main.js: onMine(letter)
          → quest.js: tryCollect(letter)   // gates inventory.add()
          → audio.js: speakLetter(letter)  // TTS: name + phonetic sound
  → quest.js: update() [every frame]
      → renderProgress()   // update lit slots
      → check()            // if hasAll(word) → celebrate → advance
```

---

## 5. File-by-File Reference

### `src/main.js`

Scene root. Creates camera, renderer, lights, and calls every module's factory.
Wires up events and runs the `tick()` render loop.

Key decisions:
- `dt` clamped to 50 ms max (`Math.min(0.05, clock.getDelta())`) so physics
  don't explode on tab-switch lag spikes.
- `scene.add(controls.getObject())` — on desktop this adds the PointerLockControls
  yaw object; on mobile it's a no-op (camera is already in the scene).
- `isMobile()` imported from `controls.js` to conditionally show the keyboard hint.
- `mobile:mine` CustomEvent fired by the ⛏️ button in `controls.js`, caught here
  to call `mining.mine()`.

```js
// Tick order matters:
updateWater(dt)       // UV scroll on water plane
quest.update()        // check word completion
updateAnimals(dt)     // wander AI + separation
updateSeaAnimals(dt)  // orbital AI + dolphin jumps
updateControls(dt, letterBlocks, [...treeColliders, ...getAnimalColliders()])
mining.update()       // raycast highlight
renderer.render(scene, camera)
```

---

### `src/controls.js`

Exports:
- `isMobile()` — detection helper used by `main.js`
- `createControls(camera, domElement)` — returns `{ controls, update }`

#### Desktop path (`createDesktopControls`)

Wraps Three.js `PointerLockControls`. WASD + arrow keys + Space to jump.
Returns `{ controls, update(dt, blocks, solids) }`.

#### Mobile path (`createMobileControls`)

Builds a DOM overlay (`position:fixed, inset:0, zIndex:20`) with:
- **Joystick ring** (`joyBase`) + **thumb** (`joyThumb`) — appear at touch point,
  hidden when finger lifts. Left half of screen only.
- **Look zone** — right half of screen, drag to change `yaw`/`pitch`.
- **⛏️ button** — fires `window.dispatchEvent(new CustomEvent('mobile:mine'))`.
- **↑ button** — sets `velocityY = JUMP_SPEED` when on ground.
- **⏸ button** — calls `controls.unlock()`.

The fake `controls` object has the same API shape as `PointerLockControls`:
`isLocked`, `lock()`, `unlock()`, `addEventListener(type, cb)`, `getObject()`.

`camera.rotation.order = 'YXZ'` is set so yaw/pitch apply independently.

#### Shared collision helpers (module-level, used by both paths)

```
xzOverlaps(pos, block)         AABB test in X and Z
yOverlaps(pos, block)          AABB test in Y (feet to head)
collidesAt(pos, blocks, solids) letter blocks (AABB) + tree/animal circles (XZ)
applyVertical(obj, blocks, dt, velocityY)
  → gravity integration, block landing, head-bump, ground plane
  → returns { velocityY, onGround }
```

Horizontal movement: move X → collision check → revert X if collision; same for Z.
World boundary: `±33.5` units in X and Z.

Constants: `SPEED=5.0`, `GRAVITY=18`, `JUMP_SPEED=7.2`, `GROUND_Y=1.6`,
`PLAYER_HEIGHT=1.6`, `PLAYER_RADIUS=0.32`.

---

### `src/world.js`

Exports: `buildWorld(scene)`, `updateWater(dt)`, `respawnBlock(scene, block)`,
`BLOCK` (= 1).

#### Ground layers (bottom to top)

| Layer | Y | Geometry | Notes |
|---|---|---|---|
| Water | −0.5 | `PlaneGeometry(500,500)` | UV scroll via `_waterTex.offset` |
| Sand | −0.02 | `CircleGeometry(r=38)` | Beach ring visible beyond grass |
| Grass | 0 | `CircleGeometry(r=30)` | Island interior |

#### Letter block placement

26 blocks placed with a **golden-angle spiral** (sunflower pattern) across the
island. This distributes them evenly by area — no clustering at centre or edge.

```js
const GOLDEN = Math.PI * (3 - Math.sqrt(5)); // ≈ 137.5°
radius = 3 + (ISLAND_RADIUS - 5) * Math.sqrt(t); // sqrt(t) = uniform area
angle  = i * GOLDEN;
```

Each block: `BoxGeometry(1,1,1)` with a `CanvasTexture` face.
`userData.letter` and `userData.homePos` stored for mining/respawn.

#### Trees

14 trees, also golden-angle spiral. Each tree: log trunk (height 4–5 blocks) +
5×5-minus-corners canopy at same level + 3×3 canopy + 3×3 cap.
Cherry-blossom pink leaves (`leafTexture()`).
Returns `treeColliders` — array of `{ position, radius: 0.52 }` for XZ circle
collision.

#### Eating spots

8 flower patches (each 5 flowers) + 4 hay bales scattered across the island.
Returns array of `THREE.Vector3` passed to `animals.js` via `setFoodSpots()`.
Animals have a 35% chance per wander-tick to head toward a food spot.

#### `respawnBlock(scene, block)`

Sets `block.visible = true`, then animates scale from 0.05 → 1.0 over 350 ms
with cubic ease-out using `requestAnimationFrame`.

---

### `src/textures.js`

All textures are **procedurally generated** via the Canvas 2D API and cached in
a `Map`. No image files. No network requests. Works offline.

| Export | Key | Description |
|---|---|---|
| `letterTexture(letter)` | `'A'`…`'Z'` | 256×256 pastel gradient + letter glyph |
| `woodTexture()` | `'__wood'` | Brown with vertical grain + ring lines |
| `leafTexture()` | `'__leaf'` | Cherry-blossom pink with speckle |
| `sandTexture()` | `'__sand'` | #e2c97e with grain noise |
| `waterTexture()` | `'__water'` | Teal gradient + shimmery ripple lines |
| `grassTexture()` | `'__grass'` | Pastel green #c2e0b4 with 2×2 noise |

Letter palette cycles through 8 pastel pairs (pink, peach, yellow, green, mint,
sky, lavender, rose) by `letter.charCodeAt(0) % 8`. Text is deep purple
(`#3a2e52`) with a soft white drop shadow for readability.

---

### `src/mining.js`

Exports: `createMining({ camera, scene, blocks, onMine })`  
Returns: `{ update, mine }`

- **`update()`** — called every frame. Raycasts from camera centre (`Vector2(0,0)`)
  up to 6 units. Highlights the nearest visible block with emissive glow
  (`0x444422`); clears glow when no longer targeted.
- **`mine()`** — called on click/button. Hides the highlighted block, calls
  `onMine(letter)`, schedules `respawnBlock` after 2500 ms.

---

### `src/inventory.js`

Exports: `createInventory(hotbarEl)` → `{ add, count, hasAll, removeLetters }`

Internal state: `counts` (Map: letter → number), `order` (array, max 9 entries).

The hotbar element (`#hotbar`) is kept in the DOM for `createInventory` to
render into, but it is hidden (`class="hidden"`) — the quest system replaced it
as the visible UI. Inventory is still the authoritative state store.

| Method | Description |
|---|---|
| `add(letter)` | Increment count; add to order if new |
| `count(letter)` | Return current count (0 if absent) |
| `hasAll(letters[])` | True if counts satisfy all letters, respecting duplicates |
| `removeLetters(letters[])` | Decrement counts; remove zero-count entries from order |

Duplicate handling: `hasAll(['N','N'])` requires `count('N') >= 2`.

---

### `src/quest.js`

Exports: `createQuest(inventory)` → `{ show, hide, tryCollect, update }`

Manages:
- **`#quest-panel` / `#quest-list`** — word list with ✓ done / ▶ current / space future
- **`#word-progress`** — letter slots, one `<span class="ls">` per letter of current word
- **`#celebrate`** — celebration overlay (emoji + word + "כל הכבוד!")

#### `tryCollect(letter)`

Called from `onMine` in `main.js`. Adds the letter only if the current word
needs more of it than the inventory already has. Returns `true` if accepted.

```js
const needed = word().split('').filter(l => l === letter).length;
if (inventory.count(letter) < needed) { inventory.add(letter); return true; }
```

#### `renderProgress()`

Duplicate-aware slot rendering using a running `used` counter per letter:

```js
const used = {};
w.split('').map(l => {
  used[l] = (used[l] || 0) + 1;
  const on = inventory.count(l) >= used[l];
  return `<span class="ls${on ? ' ls-on' : ''}">${l}</span>`;
});
```

#### Celebration sequence

1. Set `busy = true` (blocks further collection/check).
2. Inject emoji + word + Hebrew congratulations into `#celebrate`.
3. Restart CSS animation by removing class, forcing reflow (`void el.offsetWidth`),
   re-adding class.
4. After 2400 ms: `inventory.removeLetters`, hide celebrate, advance `idx`,
   re-render list + progress, set `busy = false`.

---

### `src/words.js`

Single export: `ANIMAL_WORDS` — ordered array of `{ word, emoji }`.

Words are ordered easy → hard (by length and letter rarity):

| # | Word | Emoji |
|---|---|---|
| 1 | DOG | 🐕 |
| 2 | CAT | 🐱 |
| 3 | BUNNY | 🐰 |
| 4 | BAMBI | 🦌 |
| 5 | PARROT | 🦜 |
| 6 | DONKEY | 🫏 |
| 7 | UNICORN | 🦄 |
| 8 | AXOLOTL | 🦎 |

**To add words:** append `{ word: 'SNAKE', emoji: '🐍' }` to the array.
The quest system picks it up automatically — no other file needs changing.

---

### `src/animals.js`

Exports: `spawnAnimals`, `updateAnimals`, `getAnimalColliders`,
`spawnSeaAnimals`, `updateSeaAnimals`, `setFoodSpots`

#### Land animal system

Each animal is a `THREE.Group` built from `BoxGeometry` parts via helpers:
- `mat(color, extra)` — MeshStandardMaterial shorthand
- `box(sx, sy, sz)` — BoxGeometry shorthand
- `part(parent, geo, mat, x, y, z)` — create Mesh, add to parent, return it
- `eyes(g, faceX, eyeY, zOff, irisColor, opts)` — 4-layer eyes (sclera, iris,
  pupil, sparkle highlight). `slit: true` for cat vertical pupils.

`userData` fields on each animal group:

| Field | Description |
|---|---|
| `groundY` | Y position of group origin when standing |
| `speed` | Units/second wander speed |
| `target` | `THREE.Vector3` current wander destination |
| `wanderTimer` | Seconds until next wander decision |
| `bobPhase` | Phase for subtle walk-bob |
| `tail` | Tail mesh reference (for animation) |
| `tailRest` | Tail rotation.z at rest |
| `isFlyer` | True for parrots (fly at `groundY=3.8`, wing flap) |
| `isHopper` | True for bunnies (hop movement) |

**Wander AI (per frame):**
1. Decrement `wanderTimer`. When ≤ 0: 35% chance pick food spot, else random
   target. Timer reset 4–12 s (food spots get 5–12 s to allow "eating" dwell).
2. Move toward target at `speed * dt`. Smooth Y-axis rotation (lerp).
3. Walking bob (`Math.abs(Math.sin(bobPhase)) * 0.045`), hopper jump arc,
   flyer altitude oscillation.
4. Island boundary: redirect to origin if `r > ISLAND_LIMIT - 1` (= 26 units).
5. **Animal separation:** O(n²) push-apart pass, min separation 1.1 units.

`getAnimalColliders()` returns live position references (no copy) with
`radius: 0.5` for all non-flying animals — used by `controls.js` for collision.

#### Sea animal system

Sea creatures orbit the island in a ring (`SEA_MIN_R=36` to `SEA_MAX_R=54`,
`SEA_Y=-0.28`). Each has:

| Field | Description |
|---|---|
| `orbitAngle` | Current angle around origin |
| `orbitRadius` | Orbit circle radius |
| `orbitAngVel` | Angular velocity (rad/s); sign = CW or CCW |
| `waterY` | Base Y when not jumping |
| `isSeaCreature` | Flag |

**Orbit facing formula** (correct tangent regardless of CW/CCW direction):
```js
const s  = Math.sign(ud.orbitAngVel);
const dx = -s * Math.sin(ud.orbitAngle);
const dz =  s * Math.cos(ud.orbitAngle);
a.rotation.y = Math.atan2(-dz, dx);
```

**Dolphin jump:** `jumpTimer` counts down; when 0, `jumpPhase` advances from
0→π each frame (`+= dt * 2.2`). Y = `waterY + sin(phase) * 1.6`,
pitch = `cos(phase) * π/5`. Resets with random 6–14 s cooldown.

**Seahorse bob:** gentle `sin(bobPhase) * 0.12` vertical oscillation at 1.8 rad/s.

#### Animal roster

Land: 3 dogs, 3 cats, 4 bunnies, 3 Bambis, 3 axolotls, 3 parrots, 2 donkeys,
2 unicorns.

Sea: 13 tropical fish (4 color variants), 3 turtles, 4 dolphins (2 pods),
3 seahorses.

---

### `src/audio.js`

Exports: `speakLetter(letter)`

Uses `window.speechSynthesis` (Web Speech API, no API key, works offline).
On mine: cancels any queued speech, then queues two utterances:
1. Letter name (`NAMES` map, e.g. `'pee'` not `'P'` — avoids "capital P" prefix).
2. Phonetic sound (`SOUNDS` map, e.g. `'puh'`).

Voice preference order: en-US Samantha → en-US Aaron/Alex → any en-US local →
any en-US → any English → voices[0]. Voices load asynchronously; `onvoiceschanged`
re-picks when ready.

**Important:** All `SOUNDS` values use single syllables ending in `-uh` (not
repeated characters like `'mmm'`), because TTS reads `'mmm'` as "M M M".

```js
const SOUNDS = {
  A:'ah', B:'buh', C:'kuh', D:'duh', E:'eh', F:'fuh', G:'guh', H:'huh',
  I:'ih', J:'juh', K:'kuh', L:'luh', M:'muh', N:'nuh', O:'oh', P:'puh',
  Q:'kwuh', R:'ruh', S:'suh', T:'tuh', U:'uh', V:'vuh', W:'wuh',
  X:'eks', Y:'yuh', Z:'zuh'
};
```

---

### `src/style.css`

Key layout rules:

| Selector | Position | Notes |
|---|---|---|
| `#crosshair` | `fixed`, centered | Always visible when playing |
| `#hotbar` | `fixed`, bottom-center | Hidden (`class="hidden"`) — state lives in inventory.js |
| `#hint` | `fixed`, top-center | Shows WASD hint; hidden on mobile |
| `#quest-panel` | `fixed`, left-center | Word list. `direction:ltr` override on RTL page |
| `.quest-title` | Inside panel | `direction:rtl` for Hebrew title only |
| `#word-progress` | `fixed`, bottom (`104px`) | `direction:ltr` — critical: prevents RTL flex reversal |
| `#celebrate` | `fixed`, centered | CSS animation `celebPop` 2.4 s, triggered by adding class `running` |

**RTL pitfall:** `<html dir="rtl">` causes `display:flex` rows to reverse.
Any English-order UI element needs `direction:ltr` to override it.

**CSS animation restart trick:**
```js
celebEl.classList.remove('running');
void celebEl.offsetWidth;   // force reflow — without this, re-adding has no effect
celebEl.classList.add('running');
```

Mobile media query (`@media (hover: none) and (pointer: coarse)`):
- Hides `#hint`
- Shrinks `#quest-panel` and letter slots
- Moves `#word-progress` up to `bottom: 168px` (above the ⛏️/↑ buttons)

---

### `index.html`

`<html lang="he" dir="rtl">` — all text is Hebrew by default.

Key DOM elements:

| ID | Purpose |
|---|---|
| `canvas` | Three.js render target |
| `crosshair` | `+` symbol, hidden until locked |
| `hotbar` | Inventory render target (hidden) |
| `hint` | WASD keyboard hint (hidden on mobile) |
| `quest-panel` | Left word-list panel (hidden until game starts) |
| `quest-list` | Word rows injected by `quest.js` |
| `word-progress` | Letter slots injected by `quest.js` |
| `celebrate` | Celebration overlay |
| `start-screen` | Full-screen start card with Hebrew rules |
| `start-btn` | Calls `controls.lock()` |

---

### `.github/workflows/deploy.yml`

Push to `main` → `npm ci` → `vite build` → `upload-pages-artifact` (from `dist/`)
→ `deploy-pages`. Manual trigger via `workflow_dispatch` also available.

Repo must have Pages enabled with `Source: GitHub Actions` (not the legacy
"Deploy from branch"). Set once with:
```bash
gh api repos/OWNER/REPO/pages --method PUT --field build_type=workflow
```

---

## 6. Key Technical Details

### Physics

- **Gravity:** 18 units/s² (accumulated as `velocityY -= GRAVITY * dt`).
- **Jump:** `velocityY = JUMP_SPEED (7.2)` on Space/↑ when `onGround`.
- **Landing:** when falling (`vy ≤ 0`) and new feet position crosses block top,
  snap to `blockTop + PLAYER_HEIGHT`.
- **Head-bump:** when rising (`vy > 0`) and head crosses block bottom, snap
  down and zero velocity.
- **Ground plane:** hard floor at `GROUND_Y = 1.6` (= `PLAYER_HEIGHT`).
- **Horizontal collision:** axis-separated — try X, revert if collision, try Z,
  revert if collision.

### Collision types

| Object | Shape | How |
|---|---|---|
| Letter blocks | AABB (1×1×1) | `xzOverlaps` + `yOverlaps` |
| Trees | XZ circle | `dx²+dz² < (PLAYER_RADIUS + 0.52)²` |
| Animals | XZ circle | Same, `radius: 0.5`, live position refs |

### Mobile touch architecture

- Joystick touch: `touchstart` on left half captures `joyId`, tracks in
  `touchmove`. Delta clamped to `maxR=55px`, normalized to −1..1.
- Look touch: `touchstart` on right half captures `lookId`, accumulates
  `yaw`/`pitch` deltas in `touchmove`.
- Multiple simultaneous touches handled by `identifier` matching.
- `touchend` + `touchcancel` both call the same cleanup handler.
- Overlay is `pointerEvents: none`; only buttons have `pointerEvents: all`.
- `canvas { touch-action: none }` prevents iOS from intercepting swipes as
  scroll/pinch-zoom.

### Texture generation

All textures are created once and cached. The letter texture is 256×256;
terrain textures are 128×128 (adequate since they tile). `magFilter: NearestFilter`
gives a clean pixelated look on letter blocks. The water texture uses `RepeatWrapping`
and its `offset` is scrolled each frame by `updateWater(dt)`.

---

## 7. Word List & Animals

Words are defined in `src/words.js` and animals are spawned in `src/animals.js`.
The two lists are intentionally matched:

| Word | Animal in world | Notes |
|---|---|---|
| DOG | Golden Retriever | Floppy ears, tail wag |
| CAT | Orange Tabby | Slit pupils, whiskers |
| BUNNY | White bunny | Hops, pink eyes |
| BAMBI | Baby deer / fawn | White spots, velvet antler nubs |
| PARROT | Macaw | Flies at y=3.8, wing flap |
| DONKEY | Grey donkey | Large ears, scrubby mane |
| UNICORN | White unicorn | Glowing horn, rainbow mane/tail |
| AXOLOTL | Pink axolotl | 6 external gills, slow waddle |

Sea animals are decorative only (not in the word list):
tropical fish (4 color variants), sea turtles, dolphins (jump), seahorses (bob).

---

## 8. Known Quirks & Past Fixes

### RTL letter reversal ("GOD" instead of "DOG")

**Cause:** `<html dir="rtl">` reverses `display:flex` row order.  
**Fix:** `#word-progress { direction: ltr; }` — English letter order is always
left-to-right regardless of page direction.

### TTS "M M M" instead of "muh"

**Cause:** `SOUNDS.M` was `'mmm'`; TTS reads repeated single characters as
individual letter names.  
**Fix:** All sounds changed to single phonetic syllables ending in `-uh`
(`'muh'`, `'nuh'`, `'luh'` etc.).

### X sound

`SOUNDS.X = 'eks'` — standard English phonics for X, not 'kss' which TTS
mispronounces.

### Redundant hotbar

After the quest system was added, the 9-slot hotbar became vestigial.
It's kept in the DOM (inventory.js renders into it) but is permanently hidden
via `class="hidden"`. The word-progress bar is the visible letter UI.

### CSS animation restart

The celebration animation uses a class toggle. Without forcing a reflow between
`remove` and `add`, the browser ignores the re-add (same class, no change).
`void celebEl.offsetWidth` reads a layout property, forcing the reflow.

### Duplicate letters in words

BUNNY needs N×2, AXOLOTL needs L×2. Both `tryCollect` and `renderProgress`
use a per-letter running counter (`used[l] = (used[l]||0)+1`) to track position-
aware satisfaction, so the second N only lights up after the first is collected.

---

## 9. Deployment

### GitHub Pages (current)

Auto-deploys on every push to `main` via `.github/workflows/deploy.yml`.  
URL: `https://vladimishaiev.github.io/minecraft/`

To deploy manually:
```bash
git push origin main        # triggers GitHub Actions
```

### Netlify (alternative / backup)

```bash
make build                  # builds dist/
# Drag dist/ to https://app.netlify.com/drop
# Or: npx netlify-cli deploy --dir=dist --prod
```

### Pre-submission checklist

- [ ] Walk the island — confirm all 26 letters are visible and mineable
- [ ] Complete at least 3 words end-to-end
- [ ] Try an impossible letter combo — confirm it's simply ignored (no crash)
- [ ] Open on a phone over cellular (not home wifi)
- [ ] Open in Safari on a second laptop
- [ ] Check rubric line by line — aim for 4/4 on each item
- [ ] Print Hebrew submission letter with QR code pointing to the live URL

---

## 10. Rubric Checklist

| Rubric item | Status | Evidence |
|---|---|---|
| Game playability | ✅ | Clear loop: mine → collect → celebrate → next word |
| Game instructions (Hebrew) | ✅ | Hebrew start screen with 4-point rules list |
| All 26 letters appear | ✅ | `scatterLetters` places one block per letter A–Z |
| Letter practice (word + image) | ✅ | TTS says name + sound; emoji shown on word complete |
| 3-letter word assembly | ✅ | Quest system with progress slots |
| Readability & design | ✅ | Pastel palette, large text, clear HUD |
| On-time submission | ⏳ | Deadline 2026-06-10 |

---

## 11. Future Ideas (Daughter's Wish List)

Ideas captured during pair sessions, deferred for "version 2":

- **Particle effect** on mine (letters fly out)
- **Sound effects** — mining clunk, celebration jingle (Web Audio API)
- **Hebrew translation** shown alongside the English word on celebration
- **Star counter** — total words completed, shown on start screen
- **Enemy** (a fox that chases the player)
- **Day/night cycle** — sky color changes over time
- **More words** — add fish names, fruit names, etc.
- **Block variants** — some blocks harder to mine (require multiple clicks)
- **Inventory UI** — re-enable the hotbar as a visual bonus, hidden by default

To add new words: edit `src/words.js` (append to `ANIMAL_WORDS`) and
`src/animals.js` (add a maker function + spawn call in `spawnAnimals`).
