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
