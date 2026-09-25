/**
 * Coordination between the intro veil and the hero's entrance.
 *
 * The hero must not play its entrance while it is hidden behind the veil, so
 * it waits for a reveal signal. Mount order between the two components isn't
 * guaranteed, so subscribing after the reveal has already fired still invokes
 * the callback immediately rather than waiting forever.
 */

/** sessionStorage key: the intro has played (or the visit began elsewhere). */
export const INTRO_SESSION_KEY = "naxis:intro-seen";

let revealed = false;
const waiters = new Set<() => void>();

export function markRevealed() {
  if (revealed) return;
  revealed = true;
  for (const fn of waiters) fn();
  waiters.clear();
}

export function onReveal(cb: () => void): () => void {
  if (revealed) {
    cb();
    return () => {};
  }
  waiters.add(cb);
  return () => {
    waiters.delete(cb);
  };
}

let heroReady: Promise<void> | null = null;

/**
 * For a hero that has more to prepare than an image (the forged wheel
 * builds a 3D scene): the veil waits on this instead.
 */
export function setHeroReady(ready: Promise<void>) {
  heroReady = ready;
}

/**
 * Resolves once the homepage hero's wheel is ready to be seen — the hero's
 * own readiness if it registered one, else its centre disc (the one
 * raster in it) loaded and decoded — so the veil never lifts onto a
 * half-drawn wheel. Capped so a slow connection can't trap
 * the visitor on the intro.
 */
export function waitForHeroWheel(timeoutMs = 6000): Promise<void> {
  const timeout = new Promise<void>((r) => setTimeout(r, timeoutMs));
  if (heroReady) return Promise.race([heroReady.catch(() => {}), timeout]);
  const img = document.querySelector<HTMLImageElement>("#top img[data-wheel-disc]");
  if (!img) return Promise.resolve();
  const ready = img.complete
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        img.addEventListener("load", () => resolve(), { once: true });
        img.addEventListener("error", () => resolve(), { once: true });
      });
  const decoded = ready.then(() => img.decode?.().catch(() => {}));
  return Promise.race([decoded.then(() => {}), timeout]);
}
