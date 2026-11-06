import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
} from 'firebase/firestore';
import {
  getDatabase,
  Database,
  ref,
  set,
  onValue,
  runTransaction,
} from 'firebase/database';
import firebaseAppletConfig from '../../firebase-applet-config.json';

// Merge provisioned firebase-applet-config.json with optional Vercel VITE_FIREBASE_* env overrides
const viteEnv = (import.meta as { env?: Record<string, string | undefined> }).env || {};
const resolvedFirebaseConfig = {
  ...firebaseAppletConfig,
  apiKey: viteEnv.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey,
  authDomain: viteEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain,
  projectId: viteEnv.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId,
  storageBucket:
    viteEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket,
  messagingSenderId:
    viteEnv.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    firebaseAppletConfig.messagingSenderId,
  appId: viteEnv.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId,
  firestoreDatabaseId:
    viteEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
    firebaseAppletConfig.firestoreDatabaseId,
};

// Initialize provisioned Firebase App & Cloud Firestore database
const app = initializeApp(resolvedFirebaseConfig);
export const db = getFirestore(app, resolvedFirebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Optional Firebase Realtime Database instance if VITE_FIREBASE_DATABASE_URL is also provided
const rtdbUrl = viteEnv.VITE_FIREBASE_DATABASE_URL || '';
export let rtdb: Database | null = null;
if (rtdbUrl && rtdbUrl.startsWith('https://')) {
  try {
    rtdb = getDatabase(app, rtdbUrl);
  } catch (err) {
    console.warn('Optional Realtime Database URL skipped:', err);
  }
}

export const isFirebaseConfigured = Boolean(
  resolvedFirebaseConfig.projectId && resolvedFirebaseConfig.apiKey
);

// Validate connection to Firestore on boot (Required by firebase-integration-rpc skill)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Structured Error Handler (Required by firebase-integration-rpc skill)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export {
  app,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  ref,
  set,
  onValue,
  runTransaction,
};

export const CLOUDINARY_CLOUD_NAME =
  viteEnv.VITE_CLOUDINARY_CLOUD_NAME || 'dxeuzdwkz';
export const CLOUDINARY_UPLOAD_PRESET =
  viteEnv.VITE_CLOUDINARY_UPLOAD_PRESET || 'Makeup';

export function isCloudinaryUrl(url?: string | null): boolean {
  return Boolean(url && url.includes('res.cloudinary.com'));
}

export function normalizeCloudinaryUrl(url: string): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  let normalized = url.trim();
  if (
    normalized.includes('/image/upload/') &&
    !normalized.includes('/image/upload/f_auto')
  ) {
    normalized = normalized.replace(
      '/image/upload/',
      '/image/upload/f_auto,q_auto/'
    );
  }
  normalized = normalized.replace(/\.(heic|heif)$/i, '.jpg');
  return normalized;
}

/**
 * Cloudinary Production Image Upload Helper
 * Configured with Cloud Name: dxeuzdwkz and Upload Preset: Makeup
 * Uploads directly to Cloudinary CDN and returns the browser-safe HTTPS secure_url.
 */
export async function uploadImageAsset(file: File): Promise<string> {
  const cloudName = CLOUDINARY_CLOUD_NAME.trim();
  const primaryPreset = CLOUDINARY_UPLOAD_PRESET.trim();
  // Try configured preset ('Makeup') first, then lowercase ('makeup') in case preset casing differs in Cloudinary console
  const presetsToTry = Array.from(
    new Set([primaryPreset, primaryPreset.toLowerCase(), 'Makeup', 'makeup'])
  ).filter(Boolean);

  if (cloudName) {
    for (const preset of presetsToTry) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', preset);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (res.ok) {
          const data = await res.json();
          if (data.secure_url) {
            return normalizeCloudinaryUrl(String(data.secure_url));
          }
        } else {
          const errText = await res.text().catch(() => '');
          console.warn(
            `Cloudinary upload attempt with preset "${preset}" returned ${res.status}:`,
            errText
          );
        }
      } catch (err) {
        console.warn(`Cloudinary network error with preset "${preset}":`, err);
      }
    }
  }

  // Fallback to compressed DataURL only if offline or Cloudinary preset is unreachable
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
