import { getItem } from 'expo-secure-store';

import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext<{isAuthenticated : boolean | null}>({ isAuthenticated : null});
const router = useRouter();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const userId = await getItem('user_info');

      if ( userId ) {
          setIsAuthenticated(true);
      } else {
          setIsAuthenticated(false);
      }
    }
  checkAuth()
  }, [])

  useEffect(() => {
    if (isAuthenticated !== null) {
        if (isAuthenticated) {
            router.replace('(tabs)');
        } else {
            router.replace('(auth)');
        }
    }
}, [isAuthenticated, router]);

  
  return (
    <AuthContext.Provider value={{ isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)