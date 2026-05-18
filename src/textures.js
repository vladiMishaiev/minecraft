import * as THREE from 'three';

// Pastel palette — soft, kid-friendly. Each entry is [light, slightly-darker]
// for a gentle gradient. Dark text reads cleanly on all of these.
const PALETTE = [
  ['#ffd1dc', '#ffb6c8'], // pastel pink
  ['#ffe0b3', '#ffcc99'], // pastel peach
  ['#fff4b3', '#ffe89a'], // pastel yellow
  ['#d4f0c2', '#b8e6a3'], // pastel green
  ['#c8ecdf', '#a8dcc6'], // pastel mint
  ['#cfe8fc', '#a8d3f0'], // pastel sky
  ['#dcd0ff', '#c1aff0'], // pastel lavender
  ['#ffd6e0', '#ffbed0'], // pastel rose
];

const cache = new Map();

export function letterTexture(letter) {
  if (cache.has(letter)) return cache.get(letter);

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const idx = letter.charCodeAt(0) % PALETTE.length;
  const [base, dark] = PALETTE[idx];

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, base);
  grad.addColorStop(1, dark);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Soft border that complements pastel fills
  ctx.strokeStyle = 'rgba(60, 50, 80, 0.25)';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, size - 10, size - 10);

  // Dark text for readability on pastel backgrounds
  ctx.fillStyle = '#3a2e52';
  ctx.font = 'bold 180px "SF Pro Display", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fillText(letter, size / 2, size / 2 + 8);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.LinearMipMapLinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(letter, tex);
  return tex;
}

export function woodTexture() {
  if (cache.has('__wood')) return cache.get('__wood');
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#a0714f';
  ctx.fillRect(0, 0, size, size);
  // vertical grain lines
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * size;
    ctx.strokeStyle = `rgba(${80 + (Math.random()*30)|0},${50 + (Math.random()*20)|0},${30 + (Math.random()*15)|0},0.35)`;
    ctx.lineWidth = 1 + Math.random();
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + (Math.random()*8-4), size); ctx.stroke();
  }
  // horizontal ring lines
  for (let y = 12; y < size; y += 12 + (Math.random() * 8 | 0)) {
    ctx.strokeStyle = 'rgba(60,35,18,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y + (Math.random()*4-2)); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set('__wood', tex);
  return tex;
}

export function leafTexture() {
  if (cache.has('__leaf')) return cache.get('__leaf');
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Cherry-blossom pink base
  ctx.fillStyle = '#f7b8cc';
  ctx.fillRect(0, 0, size, size);
  // organic speckle to break up the flat color
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    const shade = Math.random() * 40 - 20;
    const r = (247 + shade) | 0, g = (168 + shade * 0.6) | 0, b = (190 + shade * 0.4) | 0;
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(x, y, 2 + Math.random() * 2, 2 + Math.random() * 2);
  }
  // soft inner shadow around edges
  const grad = ctx.createRadialGradient(size/2, size/2, size*0.28, size/2, size/2, size*0.72);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(1, 'rgba(200,100,130,0.22)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set('__leaf', tex);
  return tex;
}

export function sandTexture() {
  if (cache.has('__sand')) return cache.get('__sand');
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#e2c97e';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1200; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    const s = Math.random() * 26 - 13;
    ctx.fillStyle = `rgb(${(220+s)|0},${(195+s)|0},${(118+s*0.4)|0})`;
    ctx.fillRect(x, y, 1 + Math.random() * 1.5, 1 + Math.random() * 1.5);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set('__sand', tex);
  return tex;
}

export function waterTexture() {
  if (cache.has('__water')) return cache.get('__water');
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#3abcde');
  grad.addColorStop(1, '#1e90b0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Shimmery ripple lines
  for (let row = 0; row < 14; row++) {
    const y0 = (row / 14) * size + Math.random() * 8;
    ctx.strokeStyle = `rgba(255,255,255,${0.08 + Math.random() * 0.14})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    for (let x = 0; x <= size; x += 5)
      ctx.lineTo(x, y0 + Math.sin(x * 0.22 + row * 1.3) * 4);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set('__water', tex);
  return tex;
}

// ── Villa textures ────────────────────────────────────────────────────────

export function villaWallTexture() {
  if (cache.has('__villa_wall')) return cache.get('__villa_wall');
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');

  // Warm cream base
  ctx.fillStyle = '#f2eadb';
  ctx.fillRect(0, 0, size, size);

  // Staggered brickwork mortar lines
  ctx.strokeStyle = 'rgba(155,130,100,0.50)';
  ctx.lineWidth = 2;
  const bh = 32;
  for (let row = 0; row * bh <= size; row++) {
    const y0 = row * bh;
    ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(size, y0); ctx.stroke();
    const xOff = (row % 2) * 32;
    for (let x = xOff; x <= size; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + bh); ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set('__villa_wall', tex);
  return tex;
}

export function villaRoofTexture() {
  if (cache.has('__villa_roof')) return cache.get('__villa_roof');
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');

  const shades = ['#c44a28', '#d05530', '#b83e22'];
  for (let row = 0; row < 8; row++) {
    const y0 = row * 16;
    ctx.fillStyle = shades[row % shades.length];
    ctx.fillRect(0, y0, size, 15);
    ctx.strokeStyle = 'rgba(70,18,5,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, y0 + 15); ctx.lineTo(size, y0 + 15); ctx.stroke();
    const xOff = (row % 2) * 20;
    for (let x = xOff; x <= size; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + 15); ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set('__villa_roof', tex);
  return tex;
}

export function villaFloorTexture() {
  if (cache.has('__villa_floor')) return cache.get('__villa_floor');
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');

  // 4 horizontal oak planks per tile
  const nPlanks = 4;
  const ph = size / nPlanks;   // plank height in pixels = 64

  for (let p = 0; p < nPlanks; p++) {
    const y0 = p * ph;

    // Warm oak base with a slight per-plank colour variation
    const v  = ((Math.random() * 34 - 17) | 0);
    const r  = Math.max(0, Math.min(255, 208 + v));
    const g  = Math.max(0, Math.min(255, 138 + ((v * 0.6) | 0)));
    const bv = Math.max(0, Math.min(255,  72 + ((v * 0.25) | 0)));
    ctx.fillStyle = `rgb(${r},${g},${bv})`;
    ctx.fillRect(0, y0, size, ph - 1);  // ph-1 leaves a 1px gap at bottom

    // Subtle horizontal grain lines within the plank
    for (let i = 0; i < 28; i++) {
      const gy    = y0 + 1 + Math.random() * (ph - 3);
      const alpha = 0.04 + Math.random() * 0.20;
      ctx.strokeStyle = `rgba(${(r - 28)|0},${(g - 20)|0},${(bv - 12)|0},${alpha})`;
      ctx.lineWidth   = 0.5 + Math.random();
      ctx.beginPath();
      ctx.moveTo(0,    gy);
      ctx.lineTo(size, gy + (Math.random() - 0.5) * 10);
      ctx.stroke();
    }

    // Occasional wood knot
    if (Math.random() < 0.45) {
      const kx = 20 + Math.random() * (size - 40);
      const ky = y0 + ph * (0.3 + Math.random() * 0.4);
      const kr = 4 + Math.random() * 6;
      ctx.beginPath();
      ctx.ellipse(kx, ky, kr, kr * 0.55, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${(r - 45)|0},${(g - 32)|0},${(bv - 20)|0},0.55)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Second ring for depth
      ctx.beginPath();
      ctx.ellipse(kx, ky, kr * 1.7, kr * 0.9, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${(r - 25)|0},${(g - 18)|0},${(bv - 10)|0},0.25)`;
      ctx.stroke();
    }
  }

  // Dark gap lines between planks
  ctx.strokeStyle = 'rgba(48,22,6,0.70)';
  ctx.lineWidth   = 1.5;
  for (let p = 1; p < nPlanks; p++) {
    const y = p * ph;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set('__villa_floor', tex);
  return tex;
}

// ─────────────────────────────────────────────────────────────────────────

export function grassTexture() {
  if (cache.has('__grass')) return cache.get('__grass');
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Pastel meadow green
  ctx.fillStyle = '#c2e0b4';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const shade = Math.random() * 30 - 15;
    const r = 180 + shade, g = 215 + shade, b = 165 + shade;
    ctx.fillStyle = `rgb(${r|0},${g|0},${b|0})`;
    ctx.fillRect(x, y, 2, 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set('__grass', tex);
  return tex;
}
