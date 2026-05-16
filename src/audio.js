// Browser SpeechSynthesis — says the letter name, then its phonetic sound.
// No assets, no API key, works offline. Quality is good on macOS Chrome/Safari.

// Spelled-out letter NAME (so the TTS doesn't say "capital P" — some voices
// announce single uppercase letters with "capital" prefix; spelling it out
// as a word avoids that entirely).
const NAMES = {
  A: 'ay',    B: 'bee',  C: 'see',  D: 'dee',  E: 'ee',
  F: 'ef',    G: 'jee',  H: 'aitch', I: 'eye', J: 'jay',
  K: 'kay',   L: 'el',   M: 'em',   N: 'en',   O: 'oh',
  P: 'pee',   Q: 'cue',  R: 'ar',   S: 'es',   T: 'tee',
  U: 'you',   V: 'vee',  W: 'double you', X: 'ex', Y: 'why',
  Z: 'zee',
};

// Phonetic SOUND for each letter (kid-friendly short sound, the way English
// teachers usually present it: B = "buh", C = "kuh", S = "sss" etc.).
// Phonetic sound for each letter — single syllable the TTS can pronounce
// as one unit. Repeated-letter spellings (mmm, sss) get read as "M M M" by
// most TTS engines, so we use the same "-uh" convention as B/D/G/P/T.
const SOUNDS = {
  A: 'ah',   B: 'buh',  C: 'kuh',  D: 'duh',  E: 'eh',
  F: 'fuh',  G: 'guh',  H: 'huh',  I: 'ih',   J: 'juh',
  K: 'kuh',  L: 'luh',  M: 'muh',  N: 'nuh',  O: 'oh',
  P: 'puh',  Q: 'kwuh', R: 'ruh',  S: 'suh',  T: 'tuh',
  U: 'uh',   V: 'vuh',  W: 'wuh',  X: 'eks',  Y: 'yuh',
  Z: 'zuh',
};

let preferredVoice = null;
let voicesReady = false;

function pickVoice() {
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;
  // Prefer high-quality en-US voices; macOS has Samantha/Alex/Karen.
  const priorities = [
    (v) => v.lang === 'en-US' && /samantha/i.test(v.name),
    (v) => v.lang === 'en-US' && /aaron|alex/i.test(v.name),
    (v) => v.lang === 'en-US' && v.localService,
    (v) => v.lang === 'en-US',
    (v) => v.lang.startsWith('en'),
  ];
  for (const test of priorities) {
    const found = voices.find(test);
    if (found) return found;
  }
  return voices[0];
}

function ensureVoice() {
  if (voicesReady) return;
  preferredVoice = pickVoice();
  if (preferredVoice) voicesReady = true;
}

// Voices load asynchronously on some browsers — listen and re-pick when ready.
if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.onvoiceschanged = () => {
    preferredVoice = pickVoice();
    voicesReady = !!preferredVoice;
  };
  ensureVoice();
}

function utter(text, { rate = 0.9, pitch = 1.0, volume = 1.0 } = {}) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = rate;
  u.pitch = pitch;
  u.volume = volume;
  if (preferredVoice) u.voice = preferredVoice;
  speechSynthesis.speak(u);
  return u;
}

/** Speak a letter and its phonetic sound. Cancels any in-progress speech so
 *  rapid mining doesn't queue up a backlog. */
export function speakLetter(letter) {
  if (typeof speechSynthesis === 'undefined') return;
  ensureVoice();

  const upper = String(letter).toUpperCase();
  const name = NAMES[upper];
  const sound = SOUNDS[upper];
  if (!name || !sound) return;

  speechSynthesis.cancel();

  // The letter name spelled phonetically (e.g. "pee" not "P") so TTS won't
  // prepend "capital".
  utter(name, { rate: 0.85, pitch: 1.05 });
  // Then the phonetic sound, slightly slower for clarity.
  utter(sound, { rate: 0.75, pitch: 1.0 });
}
