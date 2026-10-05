import { SDK_VERSION } from "firebase/app";
import { firebaseConfig } from "@/src/lib/firebase/config";
import { firebaseMessagingWorker } from "@/src/lib/firebase-messaging-worker";

export const dynamic = "force-static";
export async function GET() {
    return new Response(firebaseMessagingWorker(firebaseConfig, SDK_VERSION), {
        headers: {
            "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-cache",
            "Service-Worker-Allowed": "/", "X-Content-Type-Options": "nosniff",
        },
    });
}
