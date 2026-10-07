type AnalyticsIdentityRuntime = {
    initialize: (userId: string | null) => void;
    setUserId: (userId: string | null) => void;
};

// Use the latest session even when the Firebase SDK is still loading.
export function createAnalyticsIdentitySync(loadRuntime: () => Promise<AnalyticsIdentityRuntime | null>) {
    let userId: string | null = null;
    let appliedUserId: string | null = null;
    let runtime: AnalyticsIdentityRuntime | null = null;
    let loading: Promise<void> | null = null;

    return async (memberId: number | null) => {
        userId = memberId === null ? null : String(memberId);
        if (!loading) {
            loading = loadRuntime().then((loaded) => {
                if (!loaded) return;
                loaded.initialize(userId);
                appliedUserId = userId;
                runtime = loaded;
            }).catch((error: unknown) => {
                loading = null;
                throw error;
            });
        }
        await loading;
        if (runtime && userId !== appliedUserId) {
            runtime.setUserId(userId);
            appliedUserId = userId;
        }
    };
}
