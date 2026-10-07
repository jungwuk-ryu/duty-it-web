// Public web app configuration shared by authentication, messaging, and Analytics.
export const firebaseConfig = {
    apiKey: "AIzaSyB6Na3azaC9gMraWwxE7vYHyHKnLmsUjC0",
    authDomain: "duty-it.firebaseapp.com",
    projectId: "duty-it",
    storageBucket: "duty-it.firebasestorage.app",
    messagingSenderId: "348194173787",
    appId: "1:348194173787:web:e0027c17501f43a1d2e07e",
    measurementId: "G-1XQ0L9EYBE",
};

// Public Web Push certificate for duty-it. Override when using another certificate.
export const firebaseWebPushVapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim()
    || "BI06cJxALe3c44mW5xzESgZp40RFTNVbRD7n3184ulCbRTRL8x3NH_frK5bSGY3nZcA1yBEoROfw6oAp2qtp_dU";
