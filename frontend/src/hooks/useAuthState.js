import { useEffect, useState } from 'react';

export function useAuthState() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const stored = window.localStorage.getItem('moodcast-auth');
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    window.localStorage.setItem('moodcast-auth', String(isLoggedIn));
  }, [isLoggedIn]);

  return { isLoggedIn, setIsLoggedIn };
}
