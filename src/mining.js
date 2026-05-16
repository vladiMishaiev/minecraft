import * as THREE from 'three';
import { respawnBlock } from './world.js';

const RAYCAST_DISTANCE = 6;

export function createMining({ camera, scene, blocks, onMine }) {
  const raycaster = new THREE.Raycaster();
  raycaster.far = RAYCAST_DISTANCE;
  const center = new THREE.Vector2(0, 0);

  let highlighted = null;

  function update() {
    raycaster.setFromCamera(center, camera);
    const visible = blocks.filter((b) => b.visible);
    const hits = raycaster.intersectObjects(visible, false);
    const newTarget = hits.length > 0 ? hits[0].object : null;

    if (newTarget !== highlighted) {
      if (highlighted) highlighted.material.emissive?.setHex(0x000000);
      if (newTarget) newTarget.material.emissive?.setHex(0x444422);
      highlighted = newTarget;
    }
  }

  function mine() {
    if (!highlighted) return;
    const block = highlighted;
    const letter = block.userData.letter;

    block.visible = false;
    highlighted = null;

    onMine?.(letter);

    setTimeout(() => respawnBlock(scene, block), 2500);
  }

  return { update, mine };
}
