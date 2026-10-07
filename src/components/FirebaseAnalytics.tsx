"use client";

import { useEffect } from "react";
import { firebaseConfig } from "@/src/lib/firebase/config";

export default function FirebaseAnalytics() {
    useEffect(() => {
        let canceled = false;

        async function initializeAnalytics() {
            const [appSdk, analyticsSdk] = await Promise.all([
                import("firebase/app"),
                import("firebase/analytics"),
            ]);
            if (!await analyticsSdk.isSupported() || canceled) return;

            const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(firebaseConfig);
            analyticsSdk.getAnalytics(app);
        }

        void initializeAnalytics().catch((error: unknown) => {
            console.warn("Firebase Analytics initialization failed.", error);
        });

        return () => { canceled = true; };
    }, []);

    return null;
}
