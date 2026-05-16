import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const SPEED         = 5.0;
const GRAVITY       = 18;
const JUMP_SPEED    = 7.2;
const GROUND_Y      = 1.6;
const PLAYER_HEIGHT = 1.6;
const PLAYER_RADIUS = 0.32;

// ── Shared collision helpers (used by both desktop & mobile) ──────────────

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
  const bp   = block.position;
  const feet = pos.y - PLAYER_HEIGHT;
  return feet < bp.y + 0.5 && pos.y > bp.y - 0.5;
}

function collidesAt(pos, blocks, solids) {
  for (const b of blocks) {
    if (!b.visible) continue;
    if (xzOverlaps(pos, b) && yOverlaps(pos, b)) return true;
  }
  for (const s of solids) {
    const dx = pos.x - s.position.x, dz = pos.z - s.position.z;
    if (dx*dx + dz*dz < (PLAYER_RADIUS + s.radius) ** 2) return true;
  }
  return false;
}

/** Shared vertical physics — mutates obj.position.y, returns updated velocity & ground flag. */
function applyVertical(obj, blocks, dt, velocityY) {
  let vy        = velocityY - GRAVITY * dt;
  const newY    = obj.position.y + vy * dt;
  let resolvedY = newY;
  let onGround  = false;

  for (const b of blocks) {
    if (!b.visible || !xzOverlaps(obj.position, b)) continue;
    const blockTop    = b.position.y + 0.5;
    const blockBottom = b.position.y - 0.5;
    const oldFeet     = obj.position.y - PLAYER_HEIGHT;
    const newFeet     = newY - PLAYER_HEIGHT;
    if (vy <= 0 && newFeet <= blockTop && oldFeet >= blockTop - 0.05) {
      resolvedY = blockTop + PLAYER_HEIGHT; vy = 0; onGround = true;
    }
    if (vy > 0 && newY >= blockBottom && obj.position.y <= blockBottom + 0.05) {
      resolvedY = blockBottom; vy = 0;
    }
  }
  if (resolvedY <= GROUND_Y) { resolvedY = GROUND_Y; vy = 0; onGround = true; }
  obj.position.y = resolvedY;
  return { velocityY: vy, onGround };
}

// ── Device detection ──────────────────────────────────────────────────────

export function isMobile() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// ── Public factory ────────────────────────────────────────────────────────

export function createControls(camera, domElement) {
  return isMobile()
    ? createMobileControls(camera, domElement)
    : createDesktopControls(camera, domElement);
}

// ─────────────────────────────────────────────────────────────────────────
// Desktop (PointerLockControls + keyboard)
// ─────────────────────────────────────────────────────────────────────────

function createDesktopControls(camera, domElement) {
  const controls = new PointerLockControls(camera, domElement);
  const keys = { w: false, a: false, s: false, d: false };
  let velocityY = 0, onGround = true;

  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp')    keys.w = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft')  keys.a = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown')  keys.s = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = true;
    if (e.code === 'Space' && onGround) {
      velocityY = JUMP_SPEED; onGround = false; e.preventDefault();
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

  function update(dt, blocks = [], solids = []) {
    if (!controls.isLocked) return;

    const v = applyVertical(obj, blocks, dt, velocityY);
    velocityY = v.velocityY; onGround = v.onGround;

    camera.getWorldDirection(forward);
    forward.y = 0; forward.normalize();
    right.crossVectors(forward, up).normalize();

    const dx = (
      (keys.w ? forward.x : 0) + (keys.s ? -forward.x : 0) +
      (keys.d ? right.x   : 0) + (keys.a ? -right.x   : 0)
    ) * SPEED * dt;
    const dz = (
      (keys.w ? forward.z : 0) + (keys.s ? -forward.z : 0) +
      (keys.d ? right.z   : 0) + (keys.a ? -right.z   : 0)
    ) * SPEED * dt;

    obj.position.x += dx;
    if (collidesAt(obj.position, blocks, solids)) obj.position.x -= dx;
    obj.position.z += dz;
    if (collidesAt(obj.position, blocks, solids)) obj.position.z -= dz;

    const limit = 33.5;
    obj.position.x = Math.max(-limit, Math.min(limit, obj.position.x));
    obj.position.z = Math.max(-limit, Math.min(limit, obj.position.z));
  }

  return { controls, update };
}

// ─────────────────────────────────────────────────────────────────────────
// Mobile (touch joystick + drag-to-look + ⛏️ / ↑ buttons)
// ─────────────────────────────────────────────────────────────────────────

function createMobileControls(camera, domElement) {
  camera.rotation.order = 'YXZ';

  let isLocked  = false;
  let yaw       = 0, pitch = 0;
  let velocityY = 0, onGround = true;
  const LOOK_SENS = 0.005;

  const forward = new THREE.Vector3();
  const right   = new THREE.Vector3();
  const up      = new THREE.Vector3(0, 1, 0);

  // ── Simple event emitter ────────────────────────────────────────────
  const _listeners = {};
  const on   = (t, cb) => ((_listeners[t] = _listeners[t] || []).push(cb));
  const emit = (t)     => (_listeners[t] || []).forEach(cb => cb());

  // ── Joystick & look state ───────────────────────────────────────────
  let joyId = null, joyBX = 0, joyBY = 0, joyDX = 0, joyDZ = 0;
  let lookId = null, lookLX = 0, lookLY = 0;

  // ── Build overlay UI ────────────────────────────────────────────────
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', zIndex: '20',
    display: 'none', pointerEvents: 'none',
  });

  // Joystick ring + thumb (appear where you first touch)
  const joyBase = mkDiv({
    position: 'absolute', width: '110px', height: '110px',
    borderRadius: '50%', background: 'rgba(255,255,255,0.10)',
    border: '2px solid rgba(255,255,255,0.38)',
    transform: 'translate(-50%,-50%)', display: 'none', pointerEvents: 'none',
  });
  const joyThumb = mkDiv({
    position: 'absolute', width: '52px', height: '52px',
    borderRadius: '50%', background: 'rgba(255,255,255,0.52)',
    border: '2px solid rgba(255,255,255,0.85)',
    transform: 'translate(-50%,-50%)', display: 'none', pointerEvents: 'none',
  });
  overlay.appendChild(joyBase);
  overlay.appendChild(joyThumb);

  // Helper: circular button
  function mkBtn(label, bottom, rightPx, sizePx = 68) {
    const btn = document.createElement('button');
    btn.textContent = label;
    Object.assign(btn.style, {
      position: 'absolute', bottom: `${bottom}px`, right: `${rightPx}px`,
      width: `${sizePx}px`, height: `${sizePx}px`, borderRadius: '50%',
      fontSize: sizePx > 60 ? '30px' : '22px',
      border: '2px solid rgba(255,255,255,0.45)',
      background: 'rgba(0,0,0,0.52)', color: 'white',
      pointerEvents: 'all', userSelect: 'none', WebkitUserSelect: 'none',
      touchAction: 'manipulation', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    });
    overlay.appendChild(btn);
    return btn;
  }

  function mkDiv(styles) {
    const d = document.createElement('div');
    Object.assign(d.style, styles);
    return d;
  }

  const mineBtn  = mkBtn('⛏️', 80,  20, 72);   // bottom-right
  const jumpBtn  = mkBtn('↑',  164, 24, 60);   // above mine
  const pauseBtn = mkBtn('⏸',  12,  12, 44);   // top-right corner

  document.body.appendChild(overlay);

  // ── Button events ───────────────────────────────────────────────────
  mineBtn.addEventListener('touchstart', e => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('mobile:mine'));
  }, { passive: false });

  jumpBtn.addEventListener('touchstart', e => {
    e.preventDefault();
    if (isLocked && onGround) { velocityY = JUMP_SPEED; onGround = false; }
  }, { passive: false });

  pauseBtn.addEventListener('touchstart', e => {
    e.preventDefault();
    controls.unlock();
  }, { passive: false });

  // ── Touch look + joystick ───────────────────────────────────────────
  domElement.addEventListener('touchstart', (e) => {
    if (!isLocked) return;
    for (const t of e.changedTouches) {
      if (t.clientX < window.innerWidth * 0.5 && joyId === null) {
        joyId = t.identifier; joyBX = t.clientX; joyBY = t.clientY;
        joyBase.style.left  = t.clientX + 'px';
        joyBase.style.top   = t.clientY + 'px';
        joyThumb.style.left = t.clientX + 'px';
        joyThumb.style.top  = t.clientY + 'px';
        joyBase.style.display  = 'block';
        joyThumb.style.display = 'block';
      } else if (t.clientX >= window.innerWidth * 0.5 && lookId === null) {
        lookId = t.identifier; lookLX = t.clientX; lookLY = t.clientY;
      }
    }
  }, { passive: true });

  domElement.addEventListener('touchmove', (e) => {
    if (!isLocked) return;
    for (const t of e.changedTouches) {
      if (t.identifier === joyId) {
        const dx = t.clientX - joyBX, dy = t.clientY - joyBY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const maxR = 55, clamp = Math.min(dist, maxR);
        const nx = dist > 0.1 ? dx/dist : 0;
        const ny = dist > 0.1 ? dy/dist : 0;
        joyDX = nx * (clamp / maxR);
        joyDZ = ny * (clamp / maxR);
        joyThumb.style.left = (joyBX + nx * clamp) + 'px';
        joyThumb.style.top  = (joyBY + ny * clamp) + 'px';
      }
      if (t.identifier === lookId) {
        yaw   -= (t.clientX - lookLX) * LOOK_SENS;
        pitch -= (t.clientY - lookLY) * LOOK_SENS;
        pitch  = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, pitch));
        lookLX = t.clientX; lookLY = t.clientY;
      }
    }
  }, { passive: true });

  function onTouchEnd(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === joyId) {
        joyId = null; joyDX = 0; joyDZ = 0;
        joyBase.style.display  = 'none';
        joyThumb.style.display = 'none';
      }
      if (t.identifier === lookId) lookId = null;
    }
  }
  domElement.addEventListener('touchend',    onTouchEnd, { passive: true });
  domElement.addEventListener('touchcancel', onTouchEnd, { passive: true });

  // ── Fake controls object (same API shape as PointerLockControls) ────
  const controls = {
    get isLocked() { return isLocked; },
    lock() {
      isLocked = true;
      overlay.style.display = 'block';
      emit('lock');
    },
    unlock() {
      isLocked = false;
      overlay.style.display = 'none';
      joyId = null; joyDX = 0; joyDZ = 0;
      joyBase.style.display  = 'none';
      joyThumb.style.display = 'none';
      emit('unlock');
    },
    addEventListener(type, cb) { on(type, cb); },
    getObject() { return camera; },   // camera IS the player object on mobile
  };

  // ── Update ──────────────────────────────────────────────────────────
  function update(dt, blocks = [], solids = []) {
    if (!isLocked) return;

    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    const v = applyVertical(camera, blocks, dt, velocityY);
    velocityY = v.velocityY; onGround = v.onGround;

    camera.getWorldDirection(forward);
    forward.y = 0; forward.normalize();
    right.crossVectors(forward, up).normalize();

    // joyDZ: positive = joystick pushed down = move backward
    const dx = (-joyDZ * forward.x + joyDX * right.x) * SPEED * dt;
    const dz = (-joyDZ * forward.z + joyDX * right.z) * SPEED * dt;

    camera.position.x += dx;
    if (collidesAt(camera.position, blocks, solids)) camera.position.x -= dx;
    camera.position.z += dz;
    if (collidesAt(camera.position, blocks, solids)) camera.position.z -= dz;

    const limit = 33.5;
    camera.position.x = Math.max(-limit, Math.min(limit, camera.position.x));
    camera.position.z = Math.max(-limit, Math.min(limit, camera.position.z));
  }

  return { controls, update };
}
