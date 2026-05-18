import * as THREE from 'three';
import { buildWorld } from './world.js';
import { createControls, isMobile } from './controls.js';
import { createMining } from './mining.js';
import { createInventory } from './inventory.js';
import { createQuest } from './quest.js';
import { speakLetter } from './audio.js';
import { spawnAnimals, updateAnimals, getAnimalColliders,
         spawnSeaAnimals, updateSeaAnimals, setFoodSpots } from './animals.js';
import { updateWater } from './world.js';

const canvas = document.getElementById('canvas');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const crosshair = document.getElementById('crosshair');
const hotbarEl = document.getElementById('hotbar');
const hint = document.getElementById('hint');

const scene = new THREE.Scene();
// Pastel sky — soft baby blue with a gentle fade
scene.background = new THREE.Color(0xd6ecf7);
scene.fog = new THREE.Fog(0xd6ecf7, 80, 200);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 1.6, 14);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(10, 18, 6);
sun.castShadow = true;
sun.shadow.camera.left = -40;
sun.shadow.camera.right = 40;
sun.shadow.camera.top = 40;
sun.shadow.camera.bottom = -40;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

const ambient = new THREE.AmbientLight(0xb8d4ff, 0.55);
scene.add(ambient);

const { letterBlocks, treeColliders, eatingSpots, villaBlocks } = buildWorld(scene);
setFoodSpots(eatingSpots);
spawnAnimals(scene);
spawnSeaAnimals(scene);

const inventory = createInventory(hotbarEl);
const quest     = createQuest(inventory);
const { controls, update: updateControls } = createControls(camera, canvas);
scene.add(controls.getObject());
controls.getObject().position.set(0, 1.6, 14);

const mining = createMining({
  camera,
  scene,
  blocks: letterBlocks,
  onMine: (letter) => {
    quest.tryCollect(letter);  // only adds letter if current word needs it
    speakLetter(letter);       // always say the letter name + sound
  },
});

window.addEventListener('mousedown', (e) => {
  if (controls.isLocked && e.button === 0) mining.mine();
});

window.addEventListener('mobile:mine', () => {
  if (controls.isLocked) mining.mine();
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

startBtn.addEventListener('click', () => {
  startScreen.classList.add('hidden');
  controls.lock();
});

controls.addEventListener('lock', () => {
  crosshair.classList.remove('hidden');
  if (!isMobile()) hint.classList.remove('hidden');
  quest.show();
});
controls.addEventListener('unlock', () => {
  startScreen.classList.remove('hidden');
  quest.hide();
});

const clock = new THREE.Clock();
function tick() {
  const dt = Math.min(0.05, clock.getDelta());
  updateWater(dt);
  quest.update();
  updateAnimals(dt);
  updateSeaAnimals(dt);
  updateControls(dt, [...letterBlocks, ...villaBlocks], [...treeColliders, ...getAnimalColliders()]);
  mining.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
