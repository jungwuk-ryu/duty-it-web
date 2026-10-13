"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ANDROID_APP_STORE_URL } from "@/src/lib/event-app-links";
// Only the stylesheet of smartbanner-tsx is used; its UA parser is unnecessary for an Android-only banner.
import "smartbanner-tsx/dist/style.css";
import "./smartbanner.fancy.css";

// The header's 2x app icon, already optimized and cached, instead of the full-size touch icon.
const ICON_URL = "/_next/image?url=%2Fapp-icon-transparent.png&w=96&q=75";
// Cookie names and lifetimes match smartbanner-tsx so earlier dismissals still apply.
const CLOSED_COOKIE = "smartbanner-closed";
const INSTALLED_COOKIE = "smartbanner-installed";
const DAYS_HIDDEN = 15;
const DAYS_REMINDER = 90;

function hasCookie(name: string) {
  return document.cookie.split("; ").some((cookie) => cookie.startsWith(`${name}=`));
}

function setCookie(name: string, days: number) {
  document.cookie = `${name}=true; path=/; expires=${new Date(Date.now() + days * 86_400_000).toUTCString()}`;
}

function isStandalone() {
  return Boolean((navigator as Navigator & { standalone?: boolean }).standalone) || window.matchMedia("(display-mode: standalone)").matches;
}

function subscribe() {
  return () => {};
}

function getEligibleSnapshot() {
  return /Android/i.test(navigator.userAgent) && !isStandalone() && !hasCookie(CLOSED_COOKIE) && !hasCookie(INSTALLED_COOKIE);
}

function getServerSnapshot() {
  return false;
}

export default function AndroidOnlySmartBanner() {
  const eligible = useSyncExternalStore(subscribe, getEligibleSnapshot, getServerSnapshot);
  const [dismissed, setDismissed] = useState(false);
  const visible = eligible && !dismissed;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("smartbanner-margin-bottom", eligible);
    root.classList.toggle("smartbanner-show", visible);
  }, [eligible, visible]);

  if (!visible) return null;

  function hide(cookie: string, days: number) {
    setCookie(cookie, days);
    setDismissed(true);
  }

  return createPortal(
    <div className="smartbanner smartbanner-android smartbanner-bottom backdrop-blur-xl">
      <div className="smartbanner-container">
        <button type="button" className="smartbanner-close" aria-label="앱 설치 안내 닫기" onClick={() => hide(CLOSED_COOKIE, DAYS_HIDDEN)}>×</button>
        <span className="smartbanner-icon" style={{ backgroundImage: `url(${ICON_URL})` }} />
        <div className="smartbanner-info">
          <div className="smartbanner-title">듀잇</div>
          <div className="smartbanner-author">앱에서 최신 정보를 받아볼 수 있어요</div>
        </div>
        <div className="smartbanner-wrapper">
          <a href={ANDROID_APP_STORE_URL} target="_blank" rel="noopener noreferrer" onClick={() => hide(INSTALLED_COOKIE, DAYS_REMINDER)} className="smartbanner-button">
            <span className="smartbanner-button-text">설치</span>
          </a>
        </div>
      </div>
    </div>,
    document.body,
  );
}
