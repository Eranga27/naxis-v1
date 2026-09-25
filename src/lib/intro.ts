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

/**
 * Resolves once the hero video has buffered enough to play, so the veil never
 * lifts onto a blank or stalled video. Capped so a slow connection can't trap
 * the visitor on the white screen.
 */
export function waitForHeroVideo(timeoutMs = 6000): Promise<void> {
  return new Promise((resolve) => {
    const video = document.querySelector<HTMLVideoElement>(
      "video[data-hero-video]"
    );
    if (!video) {
      resolve();
      return;
    }
    // HAVE_FUTURE_DATA or better — already playable.
    if (video.readyState >= 3) {
      resolve();
      return;
    }

    const done = () => {
      video.removeEventListener("canplaythrough", done);
      video.removeEventListener("canplay", done);
      clearTimeout(timer);
      resolve();
    };

    const timer = setTimeout(done, timeoutMs);
    video.addEventListener("canplaythrough", done);
    video.addEventListener("canplay", done);
  });
}
