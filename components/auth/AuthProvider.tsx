// components/auth/AuthProvider.tsx
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../../lib/store/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setLoading, setInitialized } = useAuthStore();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // Dynamic import guarantees this never runs on the server
    import('../../lib/firebase/auth').then(({ onAuthStateChanged, getUserProfile }) => {
      unsubscribe = onAuthStateChanged((user) => {
        setUser(user);
        if (user) {
          getUserProfile(user.uid)
            .then((profile) => setProfile(profile))
            .catch(() => setProfile(null))
            .finally(() => {
              setLoading(false);
              setInitialized(true);
            });
        } else {
          setProfile(null);
          setLoading(false);
          setInitialized(true);
        }
      });
    });

    return () => unsubscribe?.();
  }, [setUser, setProfile, setLoading, setInitialized]);

  return <>{children}</>;
}
