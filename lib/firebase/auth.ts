// lib/firebase/auth.ts
'use client';

import { initializeApp, getApps, getApp as fbGetApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged as _onAuthStateChanged,
  type User,
  type UserCredential,
  type NextOrObserver,
  type Unsubscribe,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

function getFirebaseApp() {
  return getApps().length ? fbGetApp() : initializeApp(firebaseConfig);
}

function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

function getFirebaseDb() {
  return getFirestore(getFirebaseApp());
}

function getGoogleProvider() {
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ prompt: 'select_account' });
  return p;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: 'google' | 'email';
  createdAt: Date | null;
  lastSeen: Date | null;
  interests: string[];
  chatCount: number;
}

async function upsertUserProfile(user: User, provider: 'google' | 'email'): Promise<void> {
  const db = getFirebaseDb();
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
      photoURL: user.photoURL || null,
      provider,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      interests: [],
      chatCount: 0,
    });
  } else {
    await setDoc(ref, { lastSeen: serverTimestamp() }, { merge: true });
  }
}

export async function signInWithGoogle(): Promise<UserCredential> {
  const result = await signInWithPopup(getFirebaseAuth(), getGoogleProvider());
  await upsertUserProfile(result.user, 'google');
  return result;
}

export async function signUpWithEmail(email: string, password: string, displayName: string): Promise<UserCredential> {
  console.log('------------');
  console.groupCollapsed(process.env.NEXT_PUBLIC_FIREBASE_API_KEY, process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
  const result = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  console.log('User created:', result.user.uid);
  await updateProfile(result.user, { displayName });
  await upsertUserProfile(result.user, 'email');
  return result;
}

export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  const result = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  await setDoc(doc(getFirebaseDb(), 'users', result.user.uid), { lastSeen: serverTimestamp() }, { merge: true });
  return result;
}

export async function signOutUser(): Promise<void> {
  await signOut(getFirebaseAuth());
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(getFirebaseAuth(), email);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(getFirebaseDb(), 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    ...data,
    createdAt: data.createdAt?.toDate() ?? null,
    lastSeen: data.lastSeen?.toDate() ?? null,
  } as UserProfile;
}

export async function updateUserInterests(uid: string, interests: string[]): Promise<void> {
  await setDoc(doc(getFirebaseDb(), 'users', uid), { interests }, { merge: true });
}

export async function incrementChatCount(uid: string): Promise<void> {
  const ref = doc(getFirebaseDb(), 'users', uid);
  const snap = await getDoc(ref);
  const current = snap.data()?.chatCount ?? 0;
  await setDoc(ref, { chatCount: current + 1 }, { merge: true });
}

export function onAuthStateChanged(callback: NextOrObserver<User>): Unsubscribe {
  return _onAuthStateChanged(getFirebaseAuth(), callback);
}

export type { User };
