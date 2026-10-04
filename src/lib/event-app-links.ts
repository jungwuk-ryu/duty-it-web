import type { Metadata } from "next";
import { SITE_ORIGIN } from "./seo";

export const IOS_APP_ID = "6751395152";
export const ANDROID_APP_PACKAGE = "com.dutyit.app";
export const IOS_APP_STORE_URL = `https://apps.apple.com/kr/app/id${IOS_APP_ID}`;
export const ANDROID_APP_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_APP_PACKAGE}`;

export type AppPlatform = "ios" | "android" | null;

export function getAppPlatform(userAgent: string, maxTouchPoints = 0): AppPlatform {
  if (/Android/i.test(userAgent)) return "android";
  // iPadOS can identify itself as a desktop Mac in Safari.
  if (/iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)) return "ios";
  return null;
}

export function getEventAppLinks(eventId: number) {
  const webUrl = `${SITE_ORIGIN}/events/${eventId}`;
  const iosUrl = `dutyit://events/${eventId}`;
  // Launch from a user tap. If the app is unavailable, keep the event readable on the web.
  const androidUrl = `intent://www.dutyit.net/events/${eventId}#Intent;scheme=https;package=${ANDROID_APP_PACKAGE};S.browser_fallback_url=${encodeURIComponent(webUrl)};end`;
  return { webUrl, iosUrl, androidUrl };
}

export function getEventAppMetadata(eventId: number): Metadata {
  const { webUrl, iosUrl } = getEventAppLinks(eventId);
  return {
    itunes: { appId: IOS_APP_ID, appArgument: webUrl },
    appLinks: {
      ios: { url: iosUrl, app_store_id: IOS_APP_ID, app_name: "듀잇" },
      android: { url: webUrl, package: ANDROID_APP_PACKAGE, app_name: "듀잇" },
      web: { url: webUrl, should_fallback: true },
    },
  };
}
