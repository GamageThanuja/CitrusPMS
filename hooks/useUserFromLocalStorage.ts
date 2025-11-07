import { useEffect, useState } from "react";

export interface UserFromStorage {
  email: string | null;
  fullName: string | null;
  userId: string | null;
  userRole: string | null;
  tokenAudience: string | null;
}

export function useUserFromLocalStorage(): UserFromStorage {
  const [user, setUser] = useState<UserFromStorage>({
    email: null,
    fullName: null,
    userId: null,
    userRole: null,
    tokenAudience: null,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUser({
        email: localStorage.getItem("email"),
        fullName: localStorage.getItem("fullName"),
        userId: localStorage.getItem("userId"),
        userRole: localStorage.getItem("userRole"),
        tokenAudience: localStorage.getItem("tokenAudience"),
      });
    }
  }, []);

  return user;
}
