"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import { ANDROID_APP_STORE_URL } from "@/src/lib/event-app-links";
import "./smartbanner.fancy.css";

const STORAGE_KEY = "duit-app-banner:v1";
const CHANGE_EVENT = "duit-app-banner-change";
const DAY = 24 * 60 * 60 * 1000;
const HIDE_AFTER_CLOSE = 15 * DAY;
const HIDE_AFTER_INSTALL = 90 * DAY;

// Keeps the banner hidden for this page view even when storage writes are blocked.
let hiddenThisPage = 0;

function readHiddenUntil() {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (typeof value !== "object" || value === null) return 0;
    const { version, hiddenUntil } = value as { version?: unknown; hiddenUntil?: unknown };
    return version === 1 && typeof hiddenUntil === "number" ? hiddenUntil : 0;
  } catch { return 0; }
}

function hideFor(duration: number) {
  hiddenThisPage = Math.max(readHiddenUntil(), Date.now() + duration);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, hiddenUntil: hiddenThisPage }));
  } catch { /* Private browsing hides the banner for the current page only. */ }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot() {
  if (!/Android/i.test(navigator.userAgent)) return false;
  // The installed web app does not need an install prompt.
  if (window.matchMedia?.("(display-mode: standalone)").matches) return false;
  return Math.max(hiddenThisPage, readHiddenUntil()) <= Date.now();
}

// The server cannot know the device, so the banner appears only after hydration.
function getServerSnapshot() {
  return false;
}

export default function AndroidOnlySmartBanner() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!visible) return null;

  return (
    <aside className="smartbanner smartbanner-bottom backdrop-blur-xl" aria-label="듀잇 앱 설치 안내">
      <div className="smartbanner-container">
        <button type="button" className="smartbanner-close" aria-label="앱 설치 안내 닫기" onClick={() => hideFor(HIDE_AFTER_CLOSE)}>
          <span aria-hidden>×</span>
        </button>
        <Image src="/app-icon-transparent.png" alt="" width={46} height={46} className="smartbanner-icon" />
        <div className="smartbanner-info">
          <p className="smartbanner-title">듀잇</p>
          <p className="smartbanner-author">앱에서 최신 정보를 받아볼 수 있어요</p>
        </div>
        <div className="smartbanner-wrapper">
          <a href={ANDROID_APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="smartbanner-button" onClick={() => hideFor(HIDE_AFTER_INSTALL)}>
            <span className="smartbanner-button-text">설치<span className="sr-only"> (Google Play, 새 탭)</span></span>
          </a>
        </div>
      </div>
    </aside>
  );
}
