import "client-only";

import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseOptions,
} from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCQNadOPVyW9ly6JCP7hEqQz7Az_0Srrdo",
  authDomain: "duty-it.firebaseapp.com",
  projectId: "duty-it",
  storageBucket: "duty-it.firebasestorage.app",
  messagingSenderId: "348194173787",
  appId: "1:348194173787:web:351a6728a7c86facd2e07e",
} satisfies FirebaseOptions;

export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);

export const googleAuthProvider = new GoogleAuthProvider();

export const appleAuthProvider = new OAuthProvider("apple.com");
appleAuthProvider.addScope("email");
appleAuthProvider.addScope("name");
