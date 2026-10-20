"use client";

// Mutable state the DOM writes and the 3D desk reads every frame.
// Kept outside React so typing and pointer moves never trigger a re-render.

export const KEY_ROWS: string[][] = [
  ["Backquote", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9", "Digit0", "Minus", "Equal", "Backspace"],
  ["Tab", "KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP", "BracketLeft", "BracketRight", "Backslash"],
  ["CapsLock", "KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL", "Semicolon", "Quote", "Enter"],
  ["ShiftLeft", "KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Period", "Slash", "ShiftRight"],
  ["ControlLeft", "AltLeft", "Space", "AltRight", "ControlRight"],
];

export const desk = {
  /** KeyboardEvent.code -> true while held. */
  held: new Set<string>(),
  /** Last time (performance.now) any key went down, for codes the keyboard does not show. */
  lastAny: 0,
  /** Pointer in 0..1 viewport space. */
  pointer: { x: 0.5, y: 0.5 },
  /** True while a mouse button is held. */
  pressed: false,
  /** 0..1 how bright the monitor is; drives the light it throws on the desk. */
  screen: 0,
  /** The pose the camera has fully arrived at, or "" while it is moving. */
  settledOn: "",
  /** The monitor's screen in viewport pixels, projected from 3D each frame. */
  screenRect: { x: 0, y: 0, w: 0, h: 0 },
};

const known = new Set(KEY_ROWS.flat());

export function keyDown(code: string) {
  desk.lastAny = performance.now();
  if (known.has(code)) desk.held.add(code);
}

export function keyUp(code: string) {
  desk.held.delete(code);
}
