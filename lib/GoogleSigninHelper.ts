// lib/GoogleSigninHelper.ts
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { app } from "./firebase";

export const _signInWithGoogle = async () => {
  try {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    // Optionally, set custom parameters: provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    // result.user contains the signed-in user information.
    return result.user;
  } catch (error) {
    console.error("Google sign in error:", error);
    return null;
  }
};
