"use client";

import { useEffect } from "react";
import { useAuth } from "@/src/lib/auth/client";
import { createAnalyticsIdentitySync } from "@/src/lib/analytics-identity";
import { firebaseConfig } from "@/src/lib/firebase/config";

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
            // The global setting is queued before the SDK's async config/page_view.
            if (userId !== null) analyticsSdk.setUserId(analytics, userId, { global: true });
        },
        setUserId(userId) { analyticsSdk.setUserId(analytics, userId, { global: true }); },
    };
});

export default function FirebaseAnalytics() {
    const auth = useAuth();
    const memberId = auth.user?.id ?? null;

    useEffect(() => {
        void syncUserId(memberId).catch((error: unknown) => {
            console.warn("Firebase Analytics identity synchronization failed.", error);
        });
    }, [memberId]);

    return null;
}
