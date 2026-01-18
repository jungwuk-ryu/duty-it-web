"use client";

import { useEffect, useState } from "react";
import { SmartBanner } from "smartbanner-tsx";
import "smartbanner-tsx/dist/style.css";
import "./smartbanner.fancy.css";

function isAndroidUA(ua: string) {
  return /Android/i.test(ua);
}

export default function AndroidOnlySmartBanner() {
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    setIsAndroid(isAndroidUA(navigator.userAgent));
  }, []);

  if (!isAndroid) return null;

  return (
    <SmartBanner
      title="듀잇"
      author="앱에서 최신 정보를 받아볼 수 있어요"
      translations={{
        button: "설치",
        price_android: "",
        store_android: "",
      }}
      url={{
        ios: "",
        android: "https://play.google.com/store/apps/details?id=com.dutyit.app",
      }}
      placement="bottom"
      daysHidden={15}
      daysReminder={90}
      withPortal={true}
      className="backdrop-blur-xl "
    />
  );
}
