// Public project identifiers shared by popup sign-in and server token renewal.
export const firebaseConfig = {
    apiKey: "AIzaSyCQNadOPVyW9ly6JCP7hEqQz7Az_0Srrdo",
    authDomain: "duty-it.firebaseapp.com",
    projectId: "duty-it",
    storageBucket: "duty-it.firebasestorage.app",
    messagingSenderId: "348194173787",
    appId: "1:348194173787:web:351a6728a7c86facd2e07e",
};

// Public Web Push certificate for duty-it. Override when using another certificate.
export const firebaseWebPushVapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim()
    || "BI06cJxALe3c44mW5xzESgZp40RFTNVbRD7n3184ulCbRTRL8x3NH_frK5bSGY3nZcA1yBEoROfw6oAp2qtp_dU";
