import { ANIMAL_WORDS } from './words.js';

export function createQuest(inventory) {
  let idx  = 0;       // index into ANIMAL_WORDS
  let busy = false;   // locked during celebration

  const panelEl    = document.getElementById('quest-panel');
  const progressEl = document.getElementById('word-progress');
  const celebEl    = document.getElementById('celebrate');

  // ── Helpers ───────────────────────────────────────────────────────────
  function word()  { return ANIMAL_WORDS[idx]?.word  ?? null; }
  function emoji() { return ANIMAL_WORDS[idx]?.emoji ?? '';   }

  // ── Word list ─────────────────────────────────────────────────────────
  function renderList() {
    const listEl = document.getElementById('quest-list');
    listEl.innerHTML = '';
    ANIMAL_WORDS.forEach(({ word, emoji }, i) => {
      const el  = document.createElement('div');
      const pre = i < idx ? '✓' : i === idx ? '▶' : ' ';
      el.className = 'qi' +
        (i < idx   ? ' qi-done'    : '') +
        (i === idx ? ' qi-current' : '');
      el.innerHTML = `<span class="qi-pre">${pre}</span>`
                   + `<span class="qi-emoji">${emoji}</span>`
                   + `<span class="qi-text">${word}</span>`;
      listEl.appendChild(el);
    });
  }

  // ── Letter slots (above hotbar) ───────────────────────────────────────
  function renderProgress() {
    const w = word();
    if (!w) { progressEl.innerHTML = ''; return; }

    // Track per-position satisfaction correctly for repeated letters
    const used = {};
    const html = w.split('').map(l => {
      used[l] = (used[l] || 0) + 1;
      const on = inventory.count(l) >= used[l];
      return `<span class="ls${on ? ' ls-on' : ''}">${l}</span>`;
    }).join('');
    progressEl.innerHTML = html;
  }

  // ── Completion check ──────────────────────────────────────────────────
  function check() {
    if (busy || !word()) return;
    const ls = word().split('');
    if (!inventory.hasAll(ls)) return;

    busy = true;

    // Show celebration
    celebEl.innerHTML =
      `<div class="cel-emoji">${emoji()}</div>`
    + `<div class="cel-word">${word()}</div>`
    + `<div class="cel-sub">כל הכבוד! 🎉</div>`;
    celebEl.style.display = 'block';

    // Restart CSS animation by toggling the class
    celebEl.classList.remove('running');
    void celebEl.offsetWidth;        // force reflow
    celebEl.classList.add('running');

    setTimeout(() => {
      inventory.removeLetters(ls);
      celebEl.style.display = 'none';
      celebEl.classList.remove('running');
      idx++;
      busy = false;

      if (idx >= ANIMAL_WORDS.length) {
        progressEl.innerHTML = '';
        document.getElementById('quest-list').innerHTML =
          '<div class="qi-all-done">🏆<br>כל המילים!<br>כל הכבוד!</div>';
      } else {
        renderList();
        renderProgress();
      }
    }, 2400);
  }

  // ── Init & public API ─────────────────────────────────────────────────
  renderList();
  renderProgress();

  return {
    show() {
      panelEl.classList.remove('hidden');
      progressEl.classList.remove('hidden');
    },
    hide() {
      panelEl.classList.add('hidden');
      progressEl.classList.add('hidden');
    },

    /**
     * Call this when a letter block is mined.
     * Adds the letter to the collection only if the current word still needs it.
     * Returns true if the letter was accepted, false if it was ignored.
     */
    tryCollect(letter) {
      if (busy || !word()) return false;
      const needed = word().split('').filter(l => l === letter).length;
      if (inventory.count(letter) < needed) {
        inventory.add(letter);
        return true;
      }
      return false;
    },

    update() {
      if (!busy) { renderProgress(); check(); }
    },
  };
}
