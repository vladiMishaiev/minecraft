import * as THREE from 'three';

const ISLAND_LIMIT = 50;
const SEA_Y        = -0.28;   // where sea creatures swim (above water plane at -0.5)
const SEA_MIN_R    = 36;      // inner edge of sea creature orbit ring
const SEA_MAX_R    = 54;      // outer edge
let _elapsed = 0;
let _foodSpots = [];           // set by setFoodSpots() after world build

export function setFoodSpots(spots) { _foodSpots = spots; }

// ── Helpers ───────────────────────────────────────────────────────────────
function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.88, ...extra });
}
function box(sx, sy, sz) { return new THREE.BoxGeometry(sx, sy, sz); }

function part(parent, geo, material, x, y, z) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  parent.add(m);
  return m;
}

/**
 * Add a pair of cute layered eyes sitting ON the face surface.
 * faceX  — the exact X coordinate of the front face of the head box
 * eyeY   — vertical centre of eyes in parent coords
 * zOff   — how far left/right each eye sits from centre
 * iris   — hex iris colour
 * H      — eye height/width (bigger = cuter)
 * slit   — true for cat slit pupils
 */
function eyes(g, faceX, eyeY, zOff, irisColor, { H = 0.16, slit = false } = {}) {
  const wht = mat(0xffffff);
  const iri = mat(irisColor);
  const blk = mat(0x111111);
  for (const sign of [-1, 1]) {
    const z = sign * zOff;
    // Layer 1 – white sclera flush with face
    part(g, box(0.04, H,       H      ), wht, faceX + 0.02, eyeY, z);
    // Layer 2 – coloured iris, slightly proud
    part(g, box(0.04, H * .82, H * .82), iri, faceX + 0.04, eyeY, z);
    // Layer 3 – pupil (round or slit)
    const pw = slit ? H * .18 : H * .45;
    part(g, box(0.04, H * .55, pw     ), blk, faceX + 0.06, eyeY, z);
    // Layer 4 – sparkle highlight (top-inner corner)
    part(g, box(0.03, H * .26, H * .26), wht,
         faceX + 0.07, eyeY + H * .22, z - sign * H * .18);
  }
}

// ── 🐕 Dog (Golden Retriever) ─────────────────────────────────────────────
function makeDog() {
  const g   = new THREE.Group();
  const fur = mat(0xe8b460);
  const drk = mat(0xc07828);
  const blk = mat(0x111111);
  const pnk = mat(0xffb6c1);

  part(g, box(1.0,  0.65, 0.58), fur,  0,     0,    0);   // body
  part(g, box(0.32, 0.34, 0.36), fur,  0.52,  0.12, 0);   // neck
  // Head — centre (0.78, 0.12, 0), half = 0.28 → face X = 1.06
  part(g, box(0.56, 0.56, 0.54), fur,  0.78,  0.12, 0);

  // Muzzle + nose + tongue
  part(g, box(0.26, 0.2,  0.34), drk,  1.05, -0.05, 0);
  part(g, box(0.1,  0.09, 0.09), blk,  1.18,  0.02, 0);   // nose
  part(g, box(0.15, 0.08, 0.05), pnk,  1.06, -0.17, 0);   // tongue

  // Eyebrows (give personality)
  part(g, box(0.04, 0.05, 0.14), drk,  1.04,  0.36, -0.17);
  part(g, box(0.04, 0.05, 0.14), drk,  1.04,  0.36,  0.17);

  // Eyes: face at 0.78 + 0.28 = 1.06
  eyes(g, 1.06, 0.22, 0.18, 0x7b4f28, { H: 0.17 });

  // Floppy ears
  const eL = part(g, box(0.2, 0.36, 0.1), drk, 0.76, -0.08, -0.3);
  eL.rotation.z =  0.2;
  const eR = part(g, box(0.2, 0.36, 0.1), drk, 0.76, -0.08,  0.3);
  eR.rotation.z = -0.2;

  // Blush cheeks
  part(g, box(0.03, 0.1, 0.12), pnk, 1.07, 0.08, -0.26);
  part(g, box(0.03, 0.1, 0.12), pnk, 1.07, 0.08,  0.26);

  const legG = box(0.18, 0.44, 0.18);
  for (const [x, z] of [[0.34,0.2],[0.34,-0.2],[-0.34,0.2],[-0.34,-0.2]])
    part(g, legG, fur, x, -0.54, z);

  const tail = part(g, box(0.11, 0.4, 0.11), fur, -0.6, 0.24, 0);
  tail.rotation.z = 0.4;

  g.userData.groundY  = 0.65;
  g.userData.speed    = 2.3 + Math.random() * 0.8;
  g.userData.tail     = tail;
  g.userData.tailRest = 0.4;
  return g;
}

// ── 🐱 Cat (Orange Tabby) ────────────────────────────────────────────────
function makeCat() {
  const g   = new THREE.Group();
  const orn = mat(0xf07820);
  const drk = mat(0xc05010);
  const wht = mat(0xfaf0e0);
  const pnk = mat(0xffb6c1);
  const ros = mat(0xffcccc); // cheek blush

  part(g, box(0.85, 0.55, 0.46), orn,  0,     0,    0);
  part(g, box(0.18, 0.56, 0.48), drk,  0.1,   0,    0);   // stripe 1
  part(g, box(0.14, 0.56, 0.48), drk, -0.2,   0,    0);   // stripe 2
  part(g, box(0.24, 0.32, 0.38), wht,  0.3,  -0.05, 0);   // chest
  part(g, box(0.3,  0.3,  0.3 ), orn,  0.5,   0.08, 0);   // neck
  // Head — centre (0.72, 0.12, 0), half = 0.25 → face X = 0.97
  part(g, box(0.5,  0.5,  0.48), orn,  0.72,  0.12, 0);

  // Big pointed ears with pink inside
  part(g, box(0.12, 0.26, 0.08), orn,  0.7,   0.42, -0.18);
  part(g, box(0.12, 0.26, 0.08), orn,  0.7,   0.42,  0.18);
  part(g, box(0.07, 0.18, 0.05), pnk,  0.72,  0.42, -0.18);
  part(g, box(0.07, 0.18, 0.05), pnk,  0.72,  0.42,  0.18);

  // Eyes: face at 0.72 + 0.25 = 0.97  — slit pupils
  eyes(g, 0.97, 0.18, 0.14, 0x50c878, { H: 0.16, slit: true });

  // Nose + whiskers
  part(g, box(0.06, 0.06, 0.06), pnk,  0.98,  0.06, 0);
  part(g, box(0.33, 0.02, 0.02), wht,  0.82,  0.05, -0.2);
  part(g, box(0.33, 0.02, 0.02), wht,  0.82,  0.05,  0.2);

  // Blush cheeks
  part(g, box(0.03, 0.1, 0.1), ros, 0.97, 0.07, -0.22);
  part(g, box(0.03, 0.1, 0.1), ros, 0.97, 0.07,  0.22);

  const legG = box(0.13, 0.36, 0.13);
  for (const [x, z] of [[0.28,0.16],[0.28,-0.16],[-0.28,0.16],[-0.28,-0.16]])
    part(g, legG, orn, x, -0.45, z);

  const tail = part(g, box(0.1, 0.38, 0.1), orn, -0.52, 0.04, 0);
  tail.rotation.z = -0.65;
  const tip = part(tail, box(0.12, 0.28, 0.12), orn, 0, 0.32, 0);
  tip.rotation.z = -0.55;

  g.userData.groundY  = 0.55;
  g.userData.speed    = 1.9 + Math.random() * 0.7;
  g.userData.tail     = tail;
  g.userData.tailRest = -0.65;
  return g;
}

// ── 🐰 Bunny ─────────────────────────────────────────────────────────────
function makeBunny() {
  const g   = new THREE.Group();
  const wht = mat(0xf8f4ee);
  const pnk = mat(0xffb6c1);
  const ros = mat(0xffcccc);

  part(g, box(0.52, 0.58, 0.46), wht,  0,     0,    0);   // body
  part(g, box(0.26, 0.28, 0.36), wht,  0.3,  -0.1,  0);   // round tummy
  // Head — centre (0.34, 0.22, 0), half = 0.22 → face X = 0.56
  part(g, box(0.44, 0.44, 0.44), wht,  0.34,  0.22, 0);

  // Nose
  part(g, box(0.06, 0.06, 0.05), pnk,  0.57,  0.2,  0);

  // Eyes: face at 0.34 + 0.22 = 0.56 — pink iris (cute albino bunny)
  eyes(g, 0.56, 0.28, 0.14, 0xff9eb5, { H: 0.15 });

  // Blush cheeks
  part(g, box(0.03, 0.1, 0.1), ros, 0.56, 0.18, -0.2);
  part(g, box(0.03, 0.1, 0.1), ros, 0.56, 0.18,  0.2);

  // Tall ears
  for (const [z, rz] of [[-0.12, -0.07], [0.12, 0.07]]) {
    const ear = part(g, box(0.1, 0.5, 0.08), wht,  0.24, 0.6, z);
    ear.rotation.z = rz;
    const inner = part(g, box(0.06, 0.34, 0.05), pnk, 0.24, 0.6, z);
    inner.rotation.z = rz;
  }

  part(g, box(0.16, 0.16, 0.16), wht, -0.32, 0.06, 0);   // fluffy tail

  const legG = box(0.11, 0.24, 0.13);
  for (const [x, z] of [[0.16,0.15],[0.16,-0.15],[-0.16,0.15],[-0.16,-0.15]])
    part(g, legG, wht, x, -0.4, z);

  g.userData.groundY  = 0.5;
  g.userData.speed    = 2.2 + Math.random() * 1.0;
  g.userData.isHopper = true;
  return g;
}

// ── 🦄 Unicorn ────────────────────────────────────────────────────────────
function makeUnicorn() {
  const g    = new THREE.Group();
  const wht  = mat(0xfaf5ff);
  const hoof = mat(0xd4c5e2);
  const gold = mat(0xffd700, { emissive: 0xffaa00, emissiveIntensity: 0.4 });
  const pnk  = mat(0xffb6c1);
  const MANE = [0xff9eb5, 0xffd6a5, 0xfdffb6, 0xcaffbf, 0xa8daff, 0xd4b3ff];

  part(g, box(1.3,  0.85, 0.65), wht,  0,     0,    0);
  part(g, box(0.4,  0.58, 0.62), wht,  0.58,  0.04, 0);   // chest
  part(g, box(0.36, 0.58, 0.4 ), wht,  0.77,  0.3,  0);   // neck
  // Head — centre (1.04, 0.3, 0), half = 0.28 → face X = 1.32
  part(g, box(0.56, 0.62, 0.56), wht,  1.04,  0.3,  0);
  part(g, box(0.28, 0.24, 0.36), wht,  1.32,  0.1,  0);   // snout

  part(g, box(0.06, 0.06, 0.06), pnk,  1.46,  0.15, -0.1);
  part(g, box(0.06, 0.06, 0.06), pnk,  1.46,  0.15,  0.1);

  // Eyes: face at 1.04 + 0.28 = 1.32 — big purple sparkly eyes
  eyes(g, 1.32, 0.42, 0.21, 0x9b7fd4, { H: 0.2 });

  // Glowing horn
  const horn = part(g, box(0.09, 0.48, 0.09), gold, 1.1, 0.72, 0);
  horn.rotation.z = 0.14;

  // Rainbow mane
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    part(g, box(0.13, 0.26, 0.15), mat(MANE[i]),
      0.64 + t * 0.44, 0.36 + (1 - t) * 0.4,
      (i % 3 === 0 ? 0 : i % 3 === 1 ? -0.07 : 0.07));
  }
  // Rainbow tail
  for (let i = 0; i < 5; i++)
    part(g, box(0.11, 0.34, 0.11), mat(MANE[i]), -0.73, 0.07 + i * 0.15, (i - 2) * 0.07);

  const legG  = box(0.19, 0.58, 0.19);
  const hoofG = box(0.22, 0.14, 0.22);
  for (const [x, z] of [[0.47,0.22],[0.47,-0.22],[-0.47,0.22],[-0.47,-0.22]]) {
    part(g, legG,  wht,  x, -0.72, z);
    part(g, hoofG, hoof, x, -1.02, z);
  }

  g.userData.groundY = 1.0;
  g.userData.speed   = 2.6 + Math.random() * 0.7;
  return g;
}

// ── 🦎 Axolotl ────────────────────────────────────────────────────────────
function makeAxolotl() {
  const g     = new THREE.Group();
  const pnk   = mat(0xffb7c5);   // main body — soft rose pink
  const crm   = mat(0xfde8e8);   // cream belly + face patch
  const gillC = mat(0xff78a0);   // gill stalks — medium pink
  const gillT = mat(0xff4d8a);   // gill feather tips — deep pink
  const blush = mat(0xffaabb);   // cheek blush

  // Body — wide, low and flat like a real axolotl
  part(g, box(0.70, 0.30, 0.44), pnk,  0,      0,     0);
  part(g, box(0.55, 0.17, 0.32), crm,  0.02,  -0.10,  0);  // cream belly

  // Head — wider than body; centre (0.50, 0.08, 0), halfX=0.25 → faceX=0.75
  part(g, box(0.50, 0.44, 0.56), pnk,  0.50,  0.08,  0);
  // Big cream face patch — creates the famous wide axolotl smile
  part(g, box(0.22, 0.28, 0.48), crm,  0.74,  0.00,  0);

  // Tiny eyes (axolotls are famously small-eyed — makes them extra cute)
  eyes(g, 0.75, 0.15, 0.18, 0x330011, { H: 0.12 });

  // Rosy blush cheeks
  part(g, box(0.03, 0.09, 0.12), blush, 0.74, 0.04, -0.26);
  part(g, box(0.03, 0.09, 0.12), blush, 0.74, 0.04,  0.26);

  // Feathery external gills — 3 per side, fan upward and slightly outward
  // [headX, baseY, rotZ-fan, outward-rotX]
  const gillLayout = [
    [0.60, 0.28,  0.32, 0.40],   // front gill  — leans forward
    [0.48, 0.30,  0.00, 0.55],   // middle gill — stands tallest
    [0.36, 0.28, -0.32, 0.40],   // back gill   — leans backward
  ];
  for (const sign of [-1, 1]) {
    for (const [x, baseY, rz, rx] of gillLayout) {
      const gg = new THREE.Group();
      gg.position.set(x, baseY, sign * 0.29);
      gg.rotation.z = rz;
      gg.rotation.x = sign * rx;   // mirror outward lean for each side

      const stalk = new THREE.Mesh(box(0.07, 0.28, 0.07), gillC);
      stalk.position.set(0, 0.14, 0);
      stalk.castShadow = true;
      gg.add(stalk);

      const tip = new THREE.Mesh(box(0.06, 0.17, 0.17), gillT);
      tip.position.set(0, 0.33, 0);
      tip.castShadow = true;
      gg.add(tip);

      g.add(gg);
    }
  }

  // Four short stubby legs
  const legG = box(0.14, 0.20, 0.14);
  for (const [x, z] of [[0.24, 0.21], [0.24, -0.21], [-0.24, 0.21], [-0.24, -0.21]])
    part(g, legG, pnk, x, -0.22, z);

  // Wide fin-like tail — flat and broad, gentle sway
  const tail = part(g, box(0.34, 0.14, 0.32), pnk, -0.54, 0.05, 0);
  tail.rotation.z = -0.18;

  g.userData.groundY  = 0.28;
  g.userData.speed    = 0.9 + Math.random() * 0.4;  // slow happy waddle
  g.userData.tail     = tail;
  g.userData.tailRest = -0.18;    // negative → slow gentle sway branch
  return g;
}

// ── 🫏 Donkey ─────────────────────────────────────────────────────────────
function makeDonkey() {
  const g    = new THREE.Group();
  const grey = mat(0xb2a898);
  const lght = mat(0xd9cebc);
  const pnk  = mat(0xffb6c1);
  const drk  = mat(0x6b5a4e);
  const hoof = mat(0x3d2e22);

  part(g, box(1.15, 0.82, 0.62), grey,  0,     0,    0);
  part(g, box(0.7,  0.5,  0.55), lght, -0.05, -0.12, 0);  // belly
  part(g, box(0.38, 0.55, 0.5 ), grey,  0.56,  0.1,  0);  // chest
  part(g, box(0.34, 0.6,  0.42), grey,  0.76,  0.32, 0);  // neck
  // Head — centre (1.04, 0.32, 0), half = 0.3 → face X = 1.34
  part(g, box(0.6,  0.64, 0.56), grey,  1.04,  0.32, 0);
  part(g, box(0.3,  0.3,  0.44), lght,  1.34,  0.1,  0);  // muzzle
  part(g, box(0.07, 0.07, 0.07), pnk,   1.48,  0.15, -0.1);
  part(g, box(0.07, 0.07, 0.07), pnk,   1.48,  0.15,  0.1);

  // Eyes: face at 1.04 + 0.30 = 1.34 — warm brown doe eyes
  eyes(g, 1.34, 0.46, 0.22, 0x6b3a1f, { H: 0.19 });

  // Huge signature ears
  for (const [z, rz] of [[-0.22, -0.08], [0.22, 0.08]]) {
    const ear = part(g, box(0.15, 0.58, 0.14), grey, 0.98, 0.78, z);
    ear.rotation.z = rz;
    const inner = part(g, box(0.09, 0.4,  0.08), pnk,  0.98, 0.78, z);
    inner.rotation.z = rz;
  }

  // Scrubby mane
  for (let i = 0; i < 5; i++)
    part(g, box(0.12, 0.24, 0.1), drk, 0.66 + i * 0.1, 0.62, 0);

  const legG  = box(0.21, 0.54, 0.21);
  const hoofG = box(0.24, 0.13, 0.24);
  for (const [x, z] of [[0.4,0.22],[0.4,-0.22],[-0.4,0.22],[-0.4,-0.22]]) {
    part(g, legG,  grey, x, -0.68, z);
    part(g, hoofG, hoof, x, -0.97, z);
  }

  const tailStick = part(g, box(0.09, 0.4, 0.09), grey, -0.66, 0.16, 0);
  tailStick.rotation.z = -0.35;
  const tuft = new THREE.Mesh(box(0.17, 0.23, 0.17),
    new THREE.MeshStandardMaterial({ color: 0x6b5a4e, roughness: 0.88 }));
  tuft.position.set(0, -0.3, 0);
  tailStick.add(tuft);

  g.userData.groundY  = 0.9;
  g.userData.speed    = 1.6 + Math.random() * 0.6;
  g.userData.tail     = tailStick;
  g.userData.tailRest = -0.35;
  return g;
}

// ── 🦌 Bambi (Baby Deer / Fawn) ───────────────────────────────────────────
function makeBambi() {
  const g    = new THREE.Group();
  const tan  = mat(0xd49a6a);  // warm golden-tan fawn coat
  const crm  = mat(0xf5e6cc);  // cream — belly, muzzle, spots
  const pnk  = mat(0xffb0bc);  // pink — nose + ear linings + blush
  const drk  = mat(0x8b5e3a);  // darker for antler nubs
  const hoof = mat(0x2a1a0e);  // near-black hooves

  // Body
  part(g, box(0.90, 0.60, 0.50), tan,  0,      0,      0);
  // Cream belly
  part(g, box(0.62, 0.36, 0.36), crm,  0.06,  -0.14,   0);

  // Classic baby-deer white spots (proud of back surface)
  for (const [x, z] of [[0.28, -0.16], [0.28, 0.16], [0.06, -0.22],
                          [0.06,  0.22], [-0.12, 0],  [0.40, 0]])
    part(g, box(0.05, 0.11, 0.11), crm, x, 0.34, z);

  // Neck — graceful arch
  part(g, box(0.30, 0.52, 0.38), tan,  0.56,  0.28,   0);
  // Head — centre (0.82, 0.28, 0), half = 0.26 → face X = 1.08
  part(g, box(0.52, 0.52, 0.48), tan,  0.82,  0.28,   0);
  // Cream muzzle
  part(g, box(0.24, 0.20, 0.36), crm,  1.08,  0.12,   0);
  // Pink nose (wide, heart-shaped feel)
  part(g, box(0.07, 0.09, 0.14), pnk,  1.20,  0.18,   0);

  // Eyes: face at 0.82+0.26=1.08 — huge chocolate-brown Disney doe eyes
  eyes(g, 1.08, 0.36, 0.18, 0x3d1200, { H: 0.22 });

  // Blush cheeks
  part(g, box(0.03, 0.10, 0.12), pnk, 1.08, 0.22, -0.24);
  part(g, box(0.03, 0.10, 0.12), pnk, 1.08, 0.22,  0.24);

  // Big wide deer ears
  for (const [z, rz] of [[-0.23, -0.20], [0.23, 0.20]]) {
    const ear = part(g, box(0.12, 0.40, 0.20), tan,  0.78, 0.62, z);
    ear.rotation.z = rz;
    const inner = part(g, box(0.07, 0.27, 0.12), pnk, 0.79, 0.62, z);
    inner.rotation.z = rz;
  }

  // Tiny velvet antler nubs (baby fawn just starting to grow them)
  part(g, box(0.07, 0.15, 0.07), drk, 0.80, 0.65, -0.13);
  part(g, box(0.07, 0.15, 0.07), drk, 0.80, 0.65,  0.13);

  // Spindly long legs (characteristic fawn proportions)
  const legG  = box(0.12, 0.58, 0.12);
  const hoofG = box(0.15, 0.11, 0.15);
  for (const [x, z] of [[0.32, 0.18], [0.32, -0.18], [-0.32, 0.18], [-0.32, -0.18]]) {
    part(g, legG,  tan,  x, -0.59, z);
    part(g, hoofG, hoof, x, -0.91, z);
  }

  // Little fluffy white powder-puff tail
  const tail = part(g, box(0.14, 0.18, 0.16), crm, -0.50, 0.26, 0);
  tail.rotation.z = 0.25;

  g.userData.groundY  = 0.88;
  g.userData.speed    = 2.5 + Math.random() * 1.0;
  g.userData.tail     = tail;
  g.userData.tailRest = 0.25;
  return g;
}

// ── 🦜 Parrot ─────────────────────────────────────────────────────────────
function makeParrot() {
  const g   = new THREE.Group();
  const grn = mat(0x3dba58);
  const red = mat(0xff4444);
  const yel = mat(0xffd740);
  const blu = mat(0x4fc3f7);
  const blk = mat(0x111111);
  const wht = mat(0xffffff);
  const brn = mat(0xa0622d);

  part(g, box(0.38, 0.5,  0.32), grn, 0,    0,     0);
  // Head — centre (0.3, 0.2, 0), half = 0.16 → face X = 0.46
  part(g, box(0.32, 0.32, 0.3 ), red, 0.3,  0.2,   0);

  // Hooked beak
  const bkTop = part(g, box(0.18, 0.09, 0.09), yel, 0.45, 0.17, 0);
  bkTop.rotation.z = 0.35;
  const bkBot = part(g, box(0.13, 0.07, 0.08), yel, 0.44, 0.08, 0);
  bkBot.rotation.z = -0.2;

  // Yellow eye-ring (macaw feature), then eyes on top
  part(g, box(0.04, 0.16, 0.16), yel, 0.45, 0.25, -0.1);
  part(g, box(0.04, 0.16, 0.16), yel, 0.45, 0.25,  0.1);
  // Eyes: face at 0.3 + 0.16 = 0.46
  eyes(g, 0.46, 0.25, 0.1, 0x222222, { H: 0.11 });

  // Wings (Group for flap pivot)
  const wingL = new THREE.Group();
  wingL.position.set(0, 0.04, -0.2);
  g.add(wingL);
  part(wingL, box(0.07, 0.42, 0.46), grn,  0, 0, -0.16);
  part(wingL, box(0.06, 0.42, 0.18), yel,  0, 0, -0.35);
  part(wingL, box(0.06, 0.22, 0.14), red,  0, 0.06, -0.02);

  const wingR = new THREE.Group();
  wingR.position.set(0, 0.04, 0.2);
  g.add(wingR);
  part(wingR, box(0.07, 0.42, 0.46), grn,  0, 0,  0.16);
  part(wingR, box(0.06, 0.42, 0.18), yel,  0, 0,  0.35);
  part(wingR, box(0.06, 0.22, 0.14), red,  0, 0.06, 0.02);

  // Tail feathers
  part(g, box(0.08, 0.48, 0.06), blu, -0.28, -0.08,  0);
  part(g, box(0.08, 0.44, 0.06), blu, -0.25, -0.06, -0.11);
  part(g, box(0.08, 0.44, 0.06), blu, -0.25, -0.06,  0.11);

  part(g, box(0.06, 0.13, 0.06), brn, 0.06, -0.3, -0.1);
  part(g, box(0.06, 0.13, 0.06), brn, 0.06, -0.3,  0.1);

  g.userData.groundY   = 3.8;
  g.userData.speed     = 4.0 + Math.random() * 1.5;
  g.userData.isFlyer   = true;
  g.userData.wingL     = wingL;
  g.userData.wingR     = wingR;
  g.userData.flapPhase = Math.random() * Math.PI * 2;
  return g;
}

// ── 🐠 Tropical Fish ──────────────────────────────────────────────────────
function makeTropicalFish(bodyColor, stripeColor) {
  const g    = new THREE.Group();
  const body = mat(bodyColor);
  const str  = mat(stripeColor);
  const fin  = mat(stripeColor);
  const blk  = mat(0x111111);
  const wht  = mat(0xffffff);

  // Flat fish body (wide X, tall Y, thin Z)
  part(g, box(0.30, 0.22, 0.07), body,  0,      0,      0);
  // Two vertical stripes
  part(g, box(0.07, 0.22, 0.09), str,   0.05,   0,      0);
  part(g, box(0.07, 0.22, 0.09), str,  -0.09,   0,      0);
  // Tail fan (flares behind body)
  part(g, box(0.09, 0.22, 0.05), fin,  -0.21,   0,      0);
  part(g, box(0.07, 0.30, 0.04), fin,  -0.19,   0,      0);
  // Dorsal fin on top
  part(g, box(0.16, 0.12, 0.04), fin,   0.02,   0.17,   0);
  // Eye
  part(g, box(0.05, 0.06, 0.09), wht,  0.14,   0.04,   0);
  part(g, box(0.05, 0.04, 0.09), blk,  0.16,   0.04,   0);

  g.userData.waterY  = SEA_Y;
  g.userData.speed   = 2.8 + Math.random() * 1.4;
  g.userData.isSeaCreature = true;
  return g;
}

// ── 🐢 Sea Turtle ─────────────────────────────────────────────────────────
function makeTurtle() {
  const g     = new THREE.Group();
  const grn   = mat(0x4a9e6f);
  const dgrn  = mat(0x2e7a4f);
  const olive = mat(0x7a9e5a);

  // Shell base + dome
  part(g, box(0.58, 0.14, 0.46), grn,   0,     0,     0);
  part(g, box(0.44, 0.14, 0.34), dgrn,  0,     0.12,  0);  // dome
  // Shell hex pattern patches
  for (const [x, z] of [[0.10,0],[0,0.12],[0,-0.12],[-0.12,0],[0.10,0.12],[0.10,-0.12]])
    part(g, box(0.12, 0.04, 0.12), olive, x, 0.19, z);

  // Head + neck
  part(g, box(0.12, 0.10, 0.12), grn,  0.38,  0.04,  0);  // neck
  part(g, box(0.20, 0.16, 0.18), grn,  0.55,  0.06,  0);  // head

  // Eyes: face at 0.55+0.10=0.65
  eyes(g, 0.65, 0.10, 0.07, 0x2a6e2a, { H: 0.10 });

  // Four flippers (flat and wide)
  const fl = box(0.08, 0.04, 0.38);
  const fr = box(0.08, 0.04, 0.38);
  const rl = box(0.07, 0.04, 0.28);
  const rr = box(0.07, 0.04, 0.28);
  const fp = part(g, fl, olive,  0.22,  0,  -0.28); fp.rotation.z =  0.15;
  const fp2= part(g, fr, olive,  0.22,  0,   0.28); fp2.rotation.z= -0.15;
  part(g, rl, olive, -0.24,  0,  -0.24);
  part(g, rr, olive, -0.24,  0,   0.24);

  g.userData.waterY  = SEA_Y - 0.05;
  g.userData.speed   = 1.2 + Math.random() * 0.6;
  g.userData.isSeaCreature = true;
  return g;
}

// ── 🐬 Dolphin ────────────────────────────────────────────────────────────
function makeDolphin() {
  const g    = new THREE.Group();
  const grey = mat(0x8bb8d0);
  const lt   = mat(0xddeef8);
  const pnk  = mat(0xffccd5);

  // Torpedo body
  part(g, box(1.10, 0.28, 0.28), grey,   0,     0,      0);
  // Light belly stripe
  part(g, box(0.90, 0.12, 0.24), lt,    -0.02, -0.08,   0);
  // Head + rounded snout
  part(g, box(0.32, 0.26, 0.26), grey,  0.60,  0.02,   0);
  part(g, box(0.28, 0.12, 0.14), grey,  0.88,  0.00,   0);  // snout
  // Smile crease (pink)
  part(g, box(0.12, 0.04, 0.14), pnk,   0.92, -0.05,   0);

  // Eyes: face at 0.60+0.16=0.76
  eyes(g, 0.76, 0.08, 0.12, 0x112244, { H: 0.11 });

  // Dorsal fin
  part(g, box(0.08, 0.36, 0.18), grey, -0.04,  0.24,   0);
  // Side flippers
  const sf = box(0.12, 0.05, 0.32);
  part(g, sf, grey,  0.36,  0,   -0.18);
  part(g, sf, grey,  0.36,  0,    0.18);
  // Tail flukes (split)
  part(g, box(0.08, 0.08, 0.44), grey, -0.60,  0,      0);

  g.userData.waterY       = SEA_Y;
  g.userData.speed        = 5.0 + Math.random() * 1.5;
  g.userData.isSeaCreature = true;
  g.userData.jumpTimer    = 3 + Math.random() * 5;
  g.userData.jumpPhase    = -1;   // -1 = not jumping
  return g;
}

// ── 🦀 Seahorse ───────────────────────────────────────────────────────────
function makeSeahorse() {
  const g    = new THREE.Group();
  const col  = mat(0xff8c5a);   // warm coral orange
  const drk  = mat(0xcc5a2a);
  const pnk  = mat(0xffb6c1);

  // Upright torso (tall in Y, head faces +X forward direction)
  part(g, box(0.14, 0.42, 0.14), col,  0,      0,      0);
  // Belly plates (segmented look)
  for (let i = 0; i < 4; i++)
    part(g, box(0.06, 0.06, 0.16), drk, 0.08, -0.12 + i * 0.12, 0);

  // Head (forward-facing in +X)
  part(g, box(0.16, 0.18, 0.14), col,  0.14,  0.24,   0);
  // Snout (long narrow)
  part(g, box(0.22, 0.07, 0.07), col,  0.32,  0.26,   0);
  // Crown/coronet
  part(g, box(0.09, 0.16, 0.09), drk,  0.12,  0.40,   0);
  part(g, box(0.07, 0.10, 0.07), col,  0.10,  0.50,   0);

  // Eyes: face at 0.14+0.08=0.22
  eyes(g, 0.22, 0.28, 0.06, 0x992200, { H: 0.10 });

  // Dorsal fin (flat along back)
  part(g, box(0.04, 0.28, 0.18), pnk, -0.08,  0.10,   0);
  // Pectoral fin (little side fin near head)
  part(g, box(0.04, 0.12, 0.18), pnk,  0.08,  0.18,   0);

  // Curling tail (S-curve going down and back)
  const t1 = part(g, box(0.12, 0.18, 0.12), col,  0.02, -0.32,  0);
  t1.rotation.z = -0.5;
  const t2 = part(g, box(0.10, 0.14, 0.10), drk, -0.10, -0.48,  0);
  t2.rotation.z = -1.0;
  const t3 = part(g, box(0.07, 0.10, 0.07), col, -0.18, -0.58,  0);
  t3.rotation.z = -1.5;

  g.userData.waterY  = SEA_Y + 0.1;  // floats a bit higher
  g.userData.speed   = 0.7 + Math.random() * 0.5;
  g.userData.isSeaCreature = true;
  g.userData.bobPhase = Math.random() * Math.PI * 2;
  return g;
}

// ── Sea creature spawn / update ────────────────────────────────────────────
const _sea = [];

function spawnSea(maker, scene, count, opts = {}) {
  const baseAngle  = Math.random() * Math.PI * 2;
  const baseRadius = SEA_MIN_R + Math.random() * (SEA_MAX_R - SEA_MIN_R);
  const dir        = Math.random() < 0.5 ? 1 : -1;

  for (let i = 0; i < count; i++) {
    const a = maker();
    const angle  = baseAngle  + (i - count * 0.5) * (opts.spread || 0.10);
    const radius = baseRadius + (Math.random() - 0.5) * (opts.radiusSpread || 2.5);
    a.position.set(Math.cos(angle) * radius, a.userData.waterY, Math.sin(angle) * radius);
    a.userData.orbitAngle  = angle;
    a.userData.orbitRadius = radius;
    a.userData.orbitAngVel = dir * a.userData.speed / radius;
    scene.add(a);
    _sea.push(a);
  }
}

export function spawnSeaAnimals(scene) {
  // Schools of tropical fish (clownfish, blue tang, parrotfish)
  spawnSea(makeTropicalFish.bind(null, 0xff6820, 0xffffff), scene, 4, { spread: 0.06 });
  spawnSea(makeTropicalFish.bind(null, 0x2196f3, 0xffeb3b), scene, 3, { spread: 0.07 });
  spawnSea(makeTropicalFish.bind(null, 0x4cdb70, 0xff80ab), scene, 3, { spread: 0.06 });
  spawnSea(makeTropicalFish.bind(null, 0xffe000, 0x222222), scene, 3, { spread: 0.08 });

  // Turtles (solitary, slow)
  spawnSea(makeTurtle, scene, 1);
  spawnSea(makeTurtle, scene, 1);
  spawnSea(makeTurtle, scene, 1);

  // Dolphins (fast, two pods)
  spawnSea(makeDolphin, scene, 2, { spread: 0.10, radiusSpread: 1.5 });
  spawnSea(makeDolphin, scene, 2, { spread: 0.10, radiusSpread: 1.5 });

  // Seahorses (slow, individual)
  spawnSea(makeSeahorse, scene, 1);
  spawnSea(makeSeahorse, scene, 1);
  spawnSea(makeSeahorse, scene, 1);
}

export function updateSeaAnimals(dt) {
  for (const a of _sea) {
    const ud = a.userData;

    // Advance orbit angle
    ud.orbitAngle += ud.orbitAngVel * dt;

    // Compute facing direction from tangent of orbit
    const s  = Math.sign(ud.orbitAngVel);
    const dx = -s * Math.sin(ud.orbitAngle);
    const dz =  s * Math.cos(ud.orbitAngle);
    a.rotation.y = Math.atan2(-dz, dx);

    // Dolphin jump
    if (ud.jumpPhase >= 0) {
      ud.jumpPhase += dt * 2.2;
      a.position.y  = ud.waterY + Math.sin(ud.jumpPhase) * 1.6;
      a.rotation.x  = Math.cos(ud.jumpPhase) * (Math.PI / 5);   // pitch up then down
      if (ud.jumpPhase >= Math.PI) {
        ud.jumpPhase = -1;
        a.rotation.x = 0;
        ud.jumpTimer = 6 + Math.random() * 8;
      }
    } else {
      // XZ orbit position
      a.position.x = Math.cos(ud.orbitAngle) * ud.orbitRadius;
      a.position.z = Math.sin(ud.orbitAngle) * ud.orbitRadius;

      if (ud.jumpTimer !== undefined) {
        ud.jumpTimer -= dt;
        if (ud.jumpTimer <= 0) ud.jumpPhase = 0;
        a.position.y = ud.waterY + Math.sin(_elapsed * 4 + ud.orbitAngle) * 0.04;
      } else if (ud.bobPhase !== undefined) {
        // Seahorse gentle bob
        ud.bobPhase += dt * 1.8;
        a.position.y = ud.waterY + Math.sin(ud.bobPhase) * 0.12;
      } else {
        a.position.y = ud.waterY;
      }
    }
  }
}

// ── Wander AI ─────────────────────────────────────────────────────────────
const _all = [];

function randomTarget() {
  const angle = Math.random() * Math.PI * 2;
  const r     = 5 + Math.random() * (ISLAND_LIMIT - 7);
  return new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r);
}

function spawn(maker, scene, count) {
  for (let i = 0; i < count; i++) {
    const a = maker();
    const t = randomTarget();
    a.position.set(t.x, a.userData.groundY, t.z);
    a.rotation.y           = Math.random() * Math.PI * 2;
    a.userData.target      = randomTarget();
    a.userData.wanderTimer = Math.random() * 6;
    a.userData.bobPhase    = Math.random() * Math.PI * 2;
    a.userData.hopTimer    = 0;
    scene.add(a);
    _all.push(a);
  }
}

/** Live collider list — positions update every frame, radius is body half-width. */
export function getAnimalColliders() {
  return _all
    .filter(a => !a.userData.isFlyer) // parrots are airborne, don't block ground movement
    .map(a => ({ position: a.position, radius: 0.5 }));
}

export function spawnAnimals(scene) {
  spawn(makeDog,     scene, 3);
  spawn(makeCat,     scene, 3);
  spawn(makeBunny,   scene, 4);
  spawn(makeUnicorn, scene, 2);
  spawn(makeParrot,  scene, 3);
  spawn(makeDonkey,  scene, 2);
  spawn(makeBambi,   scene, 3);
  spawn(makeAxolotl, scene, 3);
}

export function updateAnimals(dt) {
  _elapsed += dt;

  for (const a of _all) {
    const ud = a.userData;

    ud.wanderTimer -= dt;
    if (ud.wanderTimer <= 0) {
      // 35 % chance: head to a food spot instead of a random location
      if (_foodSpots.length && Math.random() < 0.35) {
        const spot = _foodSpots[Math.floor(Math.random() * _foodSpots.length)];
        ud.target      = spot.clone();
        ud.wanderTimer = 5 + Math.random() * 7;   // linger near food
      } else {
        ud.target      = randomTarget();
        ud.wanderTimer = 4 + Math.random() * 7;
      }
    }

    const dir = new THREE.Vector3().subVectors(ud.target, a.position);
    dir.y = 0;
    const dist = dir.length();

    if (dist > 0.5) {
      dir.normalize();
      a.position.x += dir.x * ud.speed * dt;
      a.position.z += dir.z * ud.speed * dt;

      // Correct formula for local-forward = +X
      const targetAngle = Math.atan2(-dir.z, dir.x);
      let delta = targetAngle - a.rotation.y;
      while (delta >  Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      a.rotation.y += delta * Math.min(1, 9 * dt);

      if (ud.isFlyer) {
        ud.flapPhase += dt * 9;
        a.position.y = ud.groundY + Math.sin(ud.flapPhase * 0.4) * 0.35;
      } else if (ud.isHopper) {
        ud.hopTimer -= dt;
        if (ud.hopTimer <= 0) { ud.hopTimer = 0.3 + Math.random() * 0.25; ud.hopPhase = 0; }
        if (ud.hopPhase !== undefined) {
          ud.hopPhase += dt * 20;
          a.position.y = ud.groundY + Math.max(0, Math.sin(ud.hopPhase) * 0.3);
          if (ud.hopPhase > Math.PI) delete ud.hopPhase;
        } else { a.position.y = ud.groundY; }
      } else {
        ud.bobPhase += dt * 7;
        a.position.y = ud.groundY + Math.abs(Math.sin(ud.bobPhase)) * 0.045;
      }
    } else {
      a.position.y = ud.groundY;
    }

    // Wing flap
    if (ud.isFlyer && ud.wingL) {
      ud.flapPhase = (ud.flapPhase || 0) + dt * 9;
      const flap = Math.sin(ud.flapPhase) * 0.7;
      ud.wingL.rotation.x = -flap;
      ud.wingR.rotation.x =  flap;
    }

    // Tail animation
    if (ud.tail) {
      ud.tail.rotation.z = ud.tailRest > 0
        ? ud.tailRest + Math.sin(_elapsed * 10) * 0.5   // dog: fast wag
        : ud.tailRest + Math.sin(_elapsed * 2.5) * 0.25; // cat/donkey: slow sway
    }

    // Island boundary
    if (Math.sqrt(a.position.x ** 2 + a.position.z ** 2) > ISLAND_LIMIT - 1)
      ud.target.set(0, 0, 0);
  }

  // ── Animal-animal separation (prevent stacking) ────────────────────────
  const MIN_SEP = 1.1; // minimum XZ distance between any two ground animals
  for (let i = 0; i < _all.length; i++) {
    if (_all[i].userData.isFlyer) continue;
    for (let j = i + 1; j < _all.length; j++) {
      if (_all[j].userData.isFlyer) continue;
      const a = _all[i], b = _all[j];
      const dx = a.position.x - b.position.x;
      const dz = a.position.z - b.position.z;
      const dist2 = dx * dx + dz * dz;
      if (dist2 < MIN_SEP * MIN_SEP && dist2 > 0.0001) {
        const dist = Math.sqrt(dist2);
        const push = (MIN_SEP - dist) * 0.5 + 0.005; // tiny extra to avoid re-overlap
        const nx = dx / dist, nz = dz / dist;
        a.position.x += nx * push;
        a.position.z += nz * push;
        b.position.x -= nx * push;
        b.position.z -= nz * push;
      }
    }
  }
}
