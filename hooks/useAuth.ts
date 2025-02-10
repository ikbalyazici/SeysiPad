import { useState, useEffect } from "react";
import { auth } from "../constants/firebaseConfig";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("👤 User state updated:", currentUser);
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  // ===============================
  // Google Auth (Expo AuthSession)
  // ===============================
  const redirectUri = makeRedirectUri({ useProxy: true } as any);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: "585626519839-9svc6er2qnvn7548t6vjocm03ap2cjc3.apps.googleusercontent.com",
    androidClientId: "585626519839-huh6vfpdps75on38sg1ptkj69f60ivo9.apps.googleusercontent.com",
    iosClientId: "585626519839-lgdea0jcqf0lqe6dea2o1i8teorlcub4.apps.googleusercontent.com",
    redirectUri,
  });

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await promptAsync();
      if (result.type !== "success") {
        throw new Error("Google authentication failed");
      }

      const { id_token } = result.params;
      const credential = GoogleAuthProvider.credential(id_token);
      const userCredential = await signInWithCredential(auth, credential);
      setUser(userCredential.user);
    } catch (error: any) {
      setError(error.message);
    }
    setLoading(false);
  };

  return { user, signUp, signIn, logout, signInWithGoogle, loading, error };
}
