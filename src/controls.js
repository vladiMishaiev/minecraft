import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const SPEED         = 5.0;
const GRAVITY       = 18;   // units / s²
const JUMP_SPEED    = 7.2;  // initial upward velocity
const GROUND_Y      = 1.6;  // eye height when standing on ground (y = 0)
const PLAYER_HEIGHT = 1.6;  // feet to eye
const PLAYER_RADIUS = 0.32; // horizontal half-width

export function createControls(camera, domElement) {
  const controls = new PointerLockControls(camera, domElement);
  const keys = { w: false, a: false, s: false, d: false };
  let velocityY = 0;
  let onGround = true;

  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp')    keys.w = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft')  keys.a = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown')  keys.s = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = true;
    if (e.code === 'Space' && onGround) {
      velocityY = JUMP_SPEED;
      onGround = false;
      e.preventDefault(); // prevent page scroll
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp')    keys.w = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft')  keys.a = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown')  keys.s = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = false;
  });

  const obj     = controls.getObject();
  const forward = new THREE.Vector3();
  const right   = new THREE.Vector3();
  const up      = new THREE.Vector3(0, 1, 0);

  // ── Collision helper ─────────────────────────────────────────────────────
  // Check if the player AABB (at position pos) overlaps any visible block.
  // We check XZ and Y independently so we can do axis-separated resolution.

  function xzOverlaps(pos, block) {
    const bp = block.position;
    return (
      pos.x + PLAYER_RADIUS > bp.x - 0.5 &&
      pos.x - PLAYER_RADIUS < bp.x + 0.5 &&
      pos.z + PLAYER_RADIUS > bp.z - 0.5 &&
      pos.z - PLAYER_RADIUS < bp.z + 0.5
    );
  }

  function yOverlaps(pos, block) {
    const bp = block.position;
    const feet = pos.y - PLAYER_HEIGHT;
    return feet < bp.y + 0.5 && pos.y > bp.y - 0.5;
  }

  function collidesAt(pos, blocks, solids) {
    // Letter blocks — full 3D AABB (supports landing on top)
    for (const b of blocks) {
      if (!b.visible) continue;
      if (xzOverlaps(pos, b) && yOverlaps(pos, b)) return true;
    }
    // Trees + animals — XZ circle only (player can't jump over them anyway)
    for (const s of solids) {
      const dx = pos.x - s.position.x;
      const dz = pos.z - s.position.z;
      const minDist = PLAYER_RADIUS + s.radius;
      if (dx * dx + dz * dz < minDist * minDist) return true;
    }
    return false;
  }

  // ── Update ────────────────────────────────────────────────────────────────
  function update(dt, blocks = [], solids = []) {
    if (!controls.isLocked) return;

    // 1. Vertical: gravity + jump ──────────────────────────────────────────
    velocityY -= GRAVITY * dt;
    const newY = obj.position.y + velocityY * dt;

    // Check if we land on top of a block or bonk our head on one.
    let resolvedY = newY;
    onGround = false;

    for (const b of blocks) {
      if (!b.visible) continue;
      if (!xzOverlaps(obj.position, b)) continue;

      const blockTop    = b.position.y + 0.5;
      const blockBottom = b.position.y - 0.5;
      const oldFeet     = obj.position.y - PLAYER_HEIGHT;
      const newFeet     = newY - PLAYER_HEIGHT;

      // Landing on top of block
      if (velocityY <= 0 && newFeet <= blockTop && oldFeet >= blockTop - 0.05) {
        resolvedY = blockTop + PLAYER_HEIGHT;
        velocityY = 0;
        onGround = true;
      }
      // Bumping head on underside of block
      if (velocityY > 0 && newY >= blockBottom && obj.position.y <= blockBottom + 0.05) {
        resolvedY = blockBottom;
        velocityY = 0;
      }
    }

    // Ground floor
    if (resolvedY <= GROUND_Y) {
      resolvedY = GROUND_Y;
      velocityY = 0;
      onGround = true;
    }
    obj.position.y = resolvedY;

    // 2. Horizontal movement with per-axis collision ───────────────────────
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, up).normalize();

    const dx = (
      (keys.w ? forward.x : 0) + (keys.s ? -forward.x : 0) +
      (keys.d ? right.x   : 0) + (keys.a ? -right.x   : 0)
    ) * SPEED * dt;

    const dz = (
      (keys.w ? forward.z : 0) + (keys.s ? -forward.z : 0) +
      (keys.d ? right.z   : 0) + (keys.a ? -right.z   : 0)
    ) * SPEED * dt;

    // Try X
    obj.position.x += dx;
    if (collidesAt(obj.position, blocks, solids)) obj.position.x -= dx;

    // Try Z
    obj.position.z += dz;
    if (collidesAt(obj.position, blocks, solids)) obj.position.z -= dz;

    // Island + beach boundary
    const limit = 33.5;
    obj.position.x = Math.max(-limit, Math.min(limit, obj.position.x));
    obj.position.z = Math.max(-limit, Math.min(limit, obj.position.z));
  }

  return { controls, update };
}
