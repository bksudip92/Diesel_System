// import React, { createContext, useState, useEffect } from 'react';
// import { supabase } from './supabase'; // Adjust path as needed

// // Define proper types for context and props
// import type { ReactNode, FC } from 'react';
// import type { Session, User } from '@supabase/supabase-js';

// interface AuthContextType {
//     user: User | null;
//     session: Session | null;
//     loading: boolean;
//     login?: (email: string, password: string) => Promise<User>;
//     signup?: (email: string, password: string) => Promise<User>;
//     logout?: () => Promise<void>;
// }

// export const AuthContext = createContext<AuthContextType>({
//     user: null,
//     session: null,
//     loading: true,
// });

// interface AuthProviderProps {
//     children: ReactNode;
// }

// export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
//     const [user, setUser] = useState<User | null>(null);
//     const [session, setSession] = useState<Session | null>(null);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         // Restore session on app start
//         const restoreSession = async () => {
//             const { data: { session } } = await supabase.auth.getSession();
//             setSession(session);
//             setUser(session?.user ?? null);
//             setLoading(false);
//             console.log(session?.user);
            
//         };
//         restoreSession();

//         // Listen for auth state changes (e.g., login, logout)
//         const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
//             setSession(session);
//             setUser(session?.user ?? null);
//         });

//         // Cleanup listener on unmount
//         return () => listener?.subscription.unsubscribe();
//     }, []);

//     // const login = async (email, password) => {
//     //     const { data, error } = await supabase.auth.signInWithPassword({ email, password });
//     //     if (error) throw error;
//     //     return data.user; // Optionally return user for further handling
//     // };

//     // const signup = async (email, password) => {
//     //     const { data, error } = await supabase.auth.signUp({ email, password });
//     //     if (error) throw error;
//     //     return data.user;
//     // };

//     // const logout = async () => {
//     //     const { error } = await supabase.auth.signOut();
//     //     if (error) throw error;
//     // };

//     return (
//         <AuthContext.Provider value={{ }}>
//             {children}
//         </AuthContext.Provider>
//     );
// };