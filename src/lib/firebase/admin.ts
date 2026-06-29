import { initializeApp, getApp, cert, type App } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

let initialized = false;

function getAdminApp(): App {
  if (initialized) return getApp();

  const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!serviceAccountB64) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 is not set");
  }

  let serviceAccount: unknown;
  try {
    serviceAccount = JSON.parse(
      Buffer.from(serviceAccountB64, "base64").toString("utf-8")
    );
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 is not valid base64-encoded JSON");
  }

  try {
    initializeApp({
      credential: cert(serviceAccount as Parameters<typeof cert>[0]),
    });
  } catch (err) {
    throw new Error(
      `Failed to initialize Firebase Admin SDK: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  }

  initialized = true;
  return getApp();
}

export async function verifyFirebaseToken(idToken: string): Promise<DecodedIdToken> {
  const app = getAdminApp();
  const auth = getAuth(app);
  const decoded = await auth.verifyIdToken(idToken);
  return decoded;
}

export function isFirebaseAdminConfigured(): boolean {
  return !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
}

export async function deleteFirebaseUser(uid: string): Promise<void> {
  const app = getAdminApp();
  const auth = getAuth(app);
  await auth.deleteUser(uid);
}
