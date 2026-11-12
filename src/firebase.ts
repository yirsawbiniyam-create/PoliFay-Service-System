import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, getDocs, collection, limit, query } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// 1. Primary App & Firestore: Local Fayda & Police Hospitality System (polifay--service-system)
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// 2. Connected External Database: Benishangul-Gumuz Region Police Commission Digital ID System (bg-police-id-system)
// System URL: https://ai.studio/apps/f169f989-859a-4d62-942f-bfdc814cebe2
export const BG_POLICE_ID_SYSTEM_CONFIG = {
  apiKey: "AIzaSyCM1WAt9B_9oq69F0N2Uhzz5gcV2w3PG40",
  authDomain: "bg-police-id-system.firebaseapp.com",
  projectId: "bg-police-id-system",
  storageBucket: "bg-police-id-system.firebasestorage.app",
  messagingSenderId: "754188638677",
  appId: "1:754188638677:web:d50e94dbc8a4aacdb9c55c",
  measurementId: "G-E4XG6QYRVR",
  firestoreDatabaseId: "(default)"
};

let policeIdAppInstance;
const existingPoliceIdApp = getApps().find((a) => a.name === 'bgPoliceIdSystem');
if (existingPoliceIdApp) {
  policeIdAppInstance = existingPoliceIdApp;
} else {
  policeIdAppInstance = initializeApp(BG_POLICE_ID_SYSTEM_CONFIG, 'bgPoliceIdSystem');
}

export const policeIdApp = policeIdAppInstance;
export const policeIdDb = getFirestore(policeIdAppInstance);

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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Check initial server connectivity for primary db
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'settings', 'config'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, using local cache / offline fallback.');
    }
    return false;
  }
}

// Check real-time connectivity to Benishangul-Gumuz Police Digital ID System
export async function testPoliceIdSystemConnection(): Promise<{ connected: boolean; count: number; error?: string }> {
  try {
    const qSnap = await getDocs(query(collection(policeIdDb, 'ids'), limit(25)));
    return {
      connected: true,
      count: qSnap.size,
    };
  } catch (err: any) {
    console.warn('Police ID system connectivity check:', err);
    return {
      connected: false,
      count: 0,
      error: err.message,
    };
  }
}

testConnection().catch(() => {});
testPoliceIdSystemConnection().catch(() => {});
