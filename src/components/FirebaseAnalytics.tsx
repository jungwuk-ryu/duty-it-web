"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/src/lib/auth/client";
import { createAnalyticsIdentitySync } from "@/src/lib/analytics-identity";
import { applyAnalyticsDisableFlag, isAnalyticsOptedOut, subscribeAnalyticsOptOut } from "@/src/lib/analytics-opt-out";
import { firebaseConfig } from "@/src/lib/firebase/config";

let setCollectionEnabled: ((enabled: boolean) => void) | null = null;

const syncUserId = createAnalyticsIdentitySync(async () => {
    const [appSdk, analyticsSdk] = await Promise.all([
        import("firebase/app"),
        import("firebase/analytics"),
    ]);
    if (!await analyticsSdk.isSupported()) return null;

    const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(firebaseConfig);
    let analytics: ReturnType<typeof analyticsSdk.initializeAnalytics>;
    return {
        initialize(userId) {
            analytics = analyticsSdk.initializeAnalytics(app);
            setCollectionEnabled = (enabled) => analyticsSdk.setAnalyticsCollectionEnabled(analytics, enabled);
            // An opt-out chosen while the SDK was loading still wins.
            if (isAnalyticsOptedOut()) setCollectionEnabled(false);
            // The global setting is queued before the SDK's async config/page_view.
            if (userId !== null) analyticsSdk.setUserId(analytics, userId, { global: true });
        },
        setUserId(userId) { analyticsSdk.setUserId(analytics, userId, { global: true }); },
    };
});

export default function FirebaseAnalytics() {
    const auth = useAuth();
    const memberId = auth.user?.id ?? null;
    // Treat the server render as opted out so nothing loads before the stored choice is read.
    const optedOut = useSyncExternalStore(subscribeAnalyticsOptOut, isAnalyticsOptedOut, () => true);

    useEffect(() => {
        applyAnalyticsDisableFlag(optedOut);
        setCollectionEnabled?.(!optedOut);
        if (optedOut) return;
        void syncUserId(memberId).catch((error: unknown) => {
            console.warn("Firebase Analytics identity synchronization failed.", error);
        });
    }, [memberId, optedOut]);

    return null;
}
