/**
 * Shared-element ("hero") transition between an event image on a list and the
 * poster of the event detail panel, using same-document View Transitions.
 *
 * The source opts in with `data-event-hero-source="<id>"` and the panel poster
 * with `data-event-hero-target="<id>"`. While `<html data-event-hero>` is set,
 * globals.css names the target `event-hero`; the source is named inline only
 * for the snapshot it belongs to, so the name is never duplicated.
 */
const HERO_NAME = "event-hero";
const WAIT_LIMIT_MS = 1_600;

function supportsHero(): boolean {
  return typeof document !== "undefined"
    && typeof document.startViewTransition === "function"
    && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function heroTarget(eventId: number): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-event-hero-target="${eventId}"]`);
}

/** Resolves when the condition holds after a DOM change, or after the limit. */
function waitForDom(condition: () => boolean): Promise<void> {
  if (condition()) return Promise.resolve();
  return new Promise((resolve) => {
    const finish = () => {
      observer.disconnect();
      window.clearTimeout(timer);
      resolve();
    };
    const observer = new MutationObserver(() => { if (condition()) finish(); });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-event-hero-target"] });
    // A slow or failed detail read must not keep the page frozen on the old snapshot.
    const timer = window.setTimeout(finish, WAIT_LIMIT_MS);
  });
}

function runHero(eventId: number, update: () => Promise<void>, cleanup: () => void): void {
  const root = document.documentElement;
  const marker = String(eventId);
  root.dataset.eventHero = marker;
  const transition = document.startViewTransition(update);
  // A skipped transition still applies the update; only the animation is lost.
  void transition.ready.catch(() => {});
  void transition.finished.catch(() => {}).finally(() => {
    cleanup();
    if (root.dataset.eventHero === marker) delete root.dataset.eventHero;
  });
}

/** Opens a detail with the source image growing into the panel poster. */
export function openEventWithHero(eventId: number, source: HTMLElement | null, navigate: () => void): boolean {
  if (!source || !supportsHero()) return false;
  source.style.viewTransitionName = HERO_NAME;
  runHero(eventId, async () => {
    source.style.viewTransitionName = "";
    navigate();
    await waitForDom(() => heroTarget(eventId) !== null);
  }, () => { source.style.viewTransitionName = ""; });
  return true;
}

/** Closes a detail with its poster returning to the image that opened it. */
export function closeEventWithHero(eventId: number, navigate: () => void): boolean {
  const source = document.querySelector<HTMLElement>(`[data-event-hero-source="${eventId}"]`);
  const target = heroTarget(eventId);
  if (!source || !target || !supportsHero()) return false;
  // A poster scrolled out of the panel would fly in from outside the visible area.
  const scroller = target.parentElement?.getBoundingClientRect();
  const poster = target.getBoundingClientRect();
  if (scroller && (poster.bottom < scroller.top + 24 || poster.top > scroller.bottom)) return false;
  runHero(eventId, async () => {
    navigate();
    await waitForDom(() => heroTarget(eventId) === null);
    source.style.viewTransitionName = HERO_NAME;
  }, () => { source.style.viewTransitionName = ""; });
  return true;
}

/** True while the panel for this event is being opened by a hero transition. */
export function isHeroOpening(eventId: number | undefined): boolean {
  return eventId !== undefined && typeof document !== "undefined"
    && document.documentElement.dataset.eventHero === String(eventId);
}
