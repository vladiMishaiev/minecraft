const HOTBAR_SIZE = 9;

export function createInventory(hotbarEl) {
  const counts = new Map();   // letter → count
  const order  = [];          // letters in order first collected (max 9)

  for (let i = 0; i < HOTBAR_SIZE; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot empty';
    hotbarEl.appendChild(slot);
  }

  function render() {
    const slots = hotbarEl.children;
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const slot   = slots[i];
      const letter = order[i];
      if (letter) {
        const c = counts.get(letter);
        slot.className = 'slot';
        slot.innerHTML = `${letter}<span class="count">${c}</span>`;
      } else {
        slot.className = 'slot empty';
        slot.textContent = '·';
      }
    }
  }

  // ── Public API ────────────────────────────────────────────────────────
  function add(letter) {
    if (!counts.has(letter)) {
      counts.set(letter, 0);
      if (order.length < HOTBAR_SIZE) order.push(letter);
    }
    counts.set(letter, counts.get(letter) + 1);
    render();
  }

  /** How many of `letter` are in inventory. */
  function count(letter) {
    return counts.get(letter) || 0;
  }

  /**
   * True if the inventory contains every letter in the array,
   * respecting duplicates (e.g. ['N','N'] requires count ≥ 2).
   */
  function hasAll(letters) {
    const needed = {};
    for (const l of letters) needed[l] = (needed[l] || 0) + 1;
    for (const [l, n] of Object.entries(needed)) {
      if ((counts.get(l) || 0) < n) return false;
    }
    return true;
  }

  /**
   * Remove exactly the letters listed (one occurrence each).
   * Also removes zero-count entries from the order array.
   */
  function removeLetters(letters) {
    const toRemove = {};
    for (const l of letters) toRemove[l] = (toRemove[l] || 0) + 1;

    for (const [l, n] of Object.entries(toRemove)) {
      const cur = counts.get(l) || 0;
      const rem = cur - n;
      if (rem <= 0) {
        counts.delete(l);
        const idx = order.indexOf(l);
        if (idx !== -1) order.splice(idx, 1);
      } else {
        counts.set(l, rem);
      }
    }
    render();
  }

  render();
  return { add, count, hasAll, removeLetters };
}
