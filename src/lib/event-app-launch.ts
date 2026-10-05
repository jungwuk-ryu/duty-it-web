import { getAppPlatform, getEventAppLinks } from "./event-app-links";

interface AppLaunchBrowser {
  navigator: Pick<Navigator, "userAgent" | "maxTouchPoints">;
  document: Pick<Document, "visibilityState">;
  location: Pick<Location, "search" | "assign">;
}

export function createEventAppLauncher() {
  const attemptedEvents = new Set<number>();

  return function launch(eventId: number, automatic = false, browser: AppLaunchBrowser | undefined = typeof window === "undefined" ? undefined : window) {
    if (!browser || browser.document.visibilityState !== "visible") return false;
    const platform = getAppPlatform(browser.navigator.userAgent, browser.navigator.maxTouchPoints);
    if (!platform) return false;
    if (automatic && (attemptedEvents.has(eventId) || new URLSearchParams(browser.location.search).get("openIn") === "web")) return false;

    // A card tap and the subsequently mounted detail must not open the app twice.
    // Also avoid another automatic prompt on remount or return from the app.
    attemptedEvents.add(eventId);
    const links = getEventAppLinks(eventId);
    try {
      browser.location.assign(platform === "ios" ? links.iosUrl : links.androidUrl);
      return true;
    } catch {
      // Browsers can refuse an external protocol. Keep the web detail available.
      return false;
    }
  };
}

export const launchEventApp = createEventAppLauncher();
