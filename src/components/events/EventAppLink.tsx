"use client";

import { Smartphone } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { ANDROID_APP_STORE_URL, getAppPlatform, getEventAppLinks, IOS_APP_STORE_URL } from "@/src/lib/event-app-links";
import { launchEventApp } from "@/src/lib/event-app-launch";
import { Button } from "@/src/components/ui/button";
import styles from "./event-detail.module.css";

function subscribe() { return () => {}; }
function getSnapshot() { return getAppPlatform(navigator.userAgent, navigator.maxTouchPoints); }
function getServerSnapshot() { return null; }

export default function EventAppLink({ eventId }: { eventId: number }) {
  const platform = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    if (platform) launchEventApp(eventId, true);
  }, [eventId, platform]);
  if (!platform) return null;
  const links = getEventAppLinks(eventId);
  const appUrl = platform === "android" ? links.androidUrl : links.iosUrl;
  const storeUrl = platform === "android" ? ANDROID_APP_STORE_URL : IOS_APP_STORE_URL;

  return <section className={styles.appLink} aria-label="듀잇 앱으로 열기">
    <div className={styles.appLinkCopy}>
      <Smartphone size={20} aria-hidden />
      <div><p>듀잇 앱에서 이어서 보기</p><span>앱에서 이 행사를 바로 확인하세요.</span></div>
    </div>
    <div className={styles.appLinkActions}>
      <Button asChild size="sm" className="rounded-lg font-bold"><a href={appUrl}>앱으로 열기</a></Button>
      <a href={`/events/${eventId}?openIn=web`} className={styles.appInstall}>웹에서 보기</a>
      <a href={storeUrl} target="_blank" rel="noopener noreferrer" className={styles.appInstall}>앱 설치<span className="sr-only"> (새 탭)</span></a>
    </div>
  </section>;
}
