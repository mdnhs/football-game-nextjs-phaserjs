import { getApps, getApp, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (typeof window === "undefined") {
    throw new Error("Firebase auth can only be used on the client");
  }
  if (!config.apiKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_FIREBASE_* env vars — set them in .env.local",
    );
  }
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(config);
  }
  if (!auth) {
    auth = getAuth(app);
  }
  return auth;
}
