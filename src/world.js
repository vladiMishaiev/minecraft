import * as THREE from 'three';
import { letterTexture, grassTexture, woodTexture, leafTexture, sandTexture, waterTexture } from './textures.js';

export const BLOCK = 1;
const ISLAND_RADIUS = 32;
const GRASS_RADIUS  = 30;   // grass disc
const SAND_RADIUS   = 38;   // sand ring (beach)
const WATER_Y       = -0.5; // world height of water surface

// Exported so main.js can animate the UV scroll each frame
let _waterTex = null;
export function updateWater(dt) {
  if (!_waterTex) return;
  _waterTex.offset.x += dt * 0.018;
  _waterTex.offset.y += dt * 0.011;
}

export function buildWorld(scene) {
  const ground = makeGround(scene);
  const letterBlocks = scatterLetters(scene);
  const treeColliders = buildTrees(scene);
  const eatingSpots = makeEatingSpots(scene);
  return { ground, letterBlocks, treeColliders, eatingSpots };
}

function makeGround(scene) {
  // ── Water (large plane behind everything) ─────────────────────────────
  _waterTex = waterTexture();
  _waterTex.repeat.set(40, 40);
  const waterGeo = new THREE.PlaneGeometry(500, 500);
  const waterMat = new THREE.MeshStandardMaterial({
    map: _waterTex,
    color: 0x29b6d8,
    roughness: 0.08,
    metalness: 0.15,
    transparent: true,
    opacity: 0.88,
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.y = WATER_Y;
  scene.add(waterMesh);

  // ── Sand disc (beach ring visible beyond grass) ────────────────────────
  const sandTex = sandTexture();
  sandTex.repeat.set(22, 22);
  const sandGeo = new THREE.CircleGeometry(SAND_RADIUS, 72);
  const sandMat = new THREE.MeshStandardMaterial({ map: sandTex, roughness: 1.0 });
  const sandMesh = new THREE.Mesh(sandGeo, sandMat);
  sandMesh.rotation.x = -Math.PI / 2;
  sandMesh.position.y = -0.02;
  sandMesh.receiveShadow = true;
  scene.add(sandMesh);

  // ── Grass disc (island interior) ───────────────────────────────────────
  const tex = grassTexture();
  tex.repeat.set(GRASS_RADIUS * 2, GRASS_RADIUS * 2);
  const geo = new THREE.CircleGeometry(GRASS_RADIUS, 72);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0;
  mesh.receiveShadow = true;
  mesh.userData.isGround = true;
  scene.add(mesh);
  return mesh;
}

// ── Eating spots ─────────────────────────────────────────────────────────

function makeEatingSpots(scene) {
  const spots = [];

  const stemMat = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.9 });
  const flowerColors = [0xff6b6b, 0xffd93d, 0x74d7ff, 0xff9ff3, 0xa8f0cf, 0xffa97a];
  const stemGeo  = new THREE.BoxGeometry(0.07, 0.24, 0.07);
  const petalGeo = new THREE.BoxGeometry(0.24, 0.09, 0.24);

  // 8 flower patches scattered across the island
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + 0.4;
    const r  = 4 + Math.random() * 20;
    const cx = Math.cos(angle) * r;
    const cz = Math.sin(angle) * r;

    for (let j = 0; j < 5; j++) {
      const ox = (Math.random() - 0.5) * 1.2;
      const oz = (Math.random() - 0.5) * 1.2;
      const color = flowerColors[(i * 3 + j) % flowerColors.length];
      const petalMat = new THREE.MeshStandardMaterial({ color, roughness: 0.75 });

      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.set(cx + ox, 0.12, cz + oz);
      stem.castShadow = true;
      scene.add(stem);

      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.set(cx + ox, 0.29, cz + oz);
      petal.castShadow = true;
      scene.add(petal);
    }
    spots.push(new THREE.Vector3(cx, 0, cz));
  }

  // 4 hay bales (food for donkeys / unicorns / bambi)
  const hayColors = [0xdaa520, 0xc8941a, 0xb88010];
  const hayGeos   = [
    new THREE.BoxGeometry(0.64, 0.46, 0.46),
    new THREE.BoxGeometry(0.52, 0.38, 0.36),
    new THREE.BoxGeometry(0.30, 0.24, 0.22),
  ];
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + 1.1;
    const r  = 6 + Math.random() * 18;
    const cx = Math.cos(angle) * r;
    const cz = Math.sin(angle) * r;
    let y = 0.23;
    for (let k = 0; k < 3; k++) {
      const m = new THREE.Mesh(hayGeos[k],
        new THREE.MeshStandardMaterial({ color: hayColors[k], roughness: 0.92 }));
      m.position.set(cx, y, cz);
      m.castShadow = true;
      scene.add(m);
      y += 0.30 - k * 0.06;
    }
    spots.push(new THREE.Vector3(cx, 0, cz));
  }

  return spots;
}

function scatterLetters(scene) {
  const blocks = [];
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const positions = positionRing(letters.length);

  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i];
    const [x, z] = positions[i];
    const block = makeLetterBlock(letter);
    block.position.set(x, BLOCK / 2, z);
    block.userData.letter = letter;
    block.userData.homePos = block.position.clone();
    scene.add(block);
    blocks.push(block);
  }
  return blocks;
}

function positionRing(count) {
  // Golden-angle spiral — places blocks evenly across the whole island area
  // (like a sunflower seed pattern), so no letter is bunched at the centre
  // or hidden at the very edge.
  const GOLDEN = Math.PI * (3 - Math.sqrt(5)); // ≈ 137.5°
  return Array.from({ length: count }, (_, i) => {
    const t      = (i + 0.5) / count;
    const radius = 3 + (ISLAND_RADIUS - 5) * Math.sqrt(t); // √t = uniform area
    const angle  = i * GOLDEN;
    return [Math.round(Math.cos(angle) * radius) + 0.5,
            Math.round(Math.sin(angle) * radius) + 0.5];
  });
}

function makeLetterBlock(letter) {
  const tex = letterTexture(letter);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, metalness: 0.05 });
  const geo = new THREE.BoxGeometry(BLOCK, BLOCK, BLOCK);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ── Trees ─────────────────────────────────────────────────────────────────

function buildTrees(scene) {
  const GOLDEN = Math.PI * (3 - Math.sqrt(5));
  const count = 14;
  const colliders = [];
  for (let i = 0; i < count; i++) {
    const angle  = i * GOLDEN + Math.PI * 0.6;
    const t      = (i + 0.5) / count;
    const radius = 6 + (ISLAND_RADIUS - 10) * Math.sqrt(t);
    const x = Math.round(Math.cos(angle) * radius);
    const z = Math.round(Math.sin(angle) * radius);
    const h = 4 + (i % 2);
    buildTree(scene, x, z, h);
    // One collider per trunk — XZ circle, radius = half block width
    colliders.push({ position: new THREE.Vector3(x, 0, z), radius: 0.52 });
  }
  return colliders;
}

function buildTree(scene, x, z, trunkHeight) {
  const woodMat = new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ map: leafTexture(), roughness: 0.85 });
  const geo1 = new THREE.BoxGeometry(BLOCK, BLOCK, BLOCK);

  // Trunk
  for (let y = 0; y < trunkHeight; y++) {
    const mesh = new THREE.Mesh(geo1, woodMat);
    mesh.position.set(x, y + 0.5, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  // Canopy — Minecraft oak style, pink leaves
  // Layer layout relative to top-of-trunk Y:
  const topY = trunkHeight - 0.5; // top trunk block centre
  const canopy = [
    { dy: 0,  offsets: ring5x5() }, // same level as top trunk
    { dy: 1,  offsets: ring5x5() }, // one above
    { dy: 2,  offsets: grid3x3() }, // 3×3
    { dy: 3,  offsets: grid3x3() }, // cap
  ];

  for (const { dy, offsets } of canopy) {
    for (const [ox, oz] of offsets) {
      const mesh = new THREE.Mesh(geo1, leafMat);
      mesh.position.set(x + ox, topY + dy, z + oz);
      mesh.receiveShadow = true;
      scene.add(mesh);
    }
  }
}

/** 5×5 grid minus the 4 outer corners (21 blocks) */
function ring5x5() {
  const out = [];
  for (let ox = -2; ox <= 2; ox++)
    for (let oz = -2; oz <= 2; oz++)
      if (!(Math.abs(ox) === 2 && Math.abs(oz) === 2))
        out.push([ox, oz]);
  return out;
}

/** Simple 3×3 grid (9 blocks) */
function grid3x3() {
  const out = [];
  for (let ox = -1; ox <= 1; ox++)
    for (let oz = -1; oz <= 1; oz++)
      out.push([ox, oz]);
  return out;
}

// ── Blocks ────────────────────────────────────────────────────────────────

export function respawnBlock(scene, block) {
  block.visible = true;
  block.scale.set(0.05, 0.05, 0.05);
  const target = 1;
  const start = performance.now();
  const tween = () => {
    const t = Math.min(1, (performance.now() - start) / 350);
    const ease = 1 - Math.pow(1 - t, 3);
    const s = 0.05 + (target - 0.05) * ease;
    block.scale.set(s, s, s);
    if (t < 1) requestAnimationFrame(tween);
  };
  tween();
}
