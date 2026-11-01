import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  continueAsGuest: () => void;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem('amar_khamar_is_guest') === 'true';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsGuest(false);
        localStorage.removeItem('amar_khamar_is_guest');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    setIsGuest(false);
    localStorage.removeItem('amar_khamar_is_guest');
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
    setIsGuest(false);
    localStorage.removeItem('amar_khamar_is_guest');
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
    setIsGuest(false);
    localStorage.removeItem('amar_khamar_is_guest');
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('amar_khamar_is_guest', 'true');
  };

  const signOutUser = async () => {
    if (user) {
      await firebaseSignOut(auth);
    }
    setIsGuest(false);
    localStorage.removeItem('amar_khamar_is_guest');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        continueAsGuest,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
