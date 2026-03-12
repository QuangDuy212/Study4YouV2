import { createContext, useContext, useEffect, useState, useCallback } from "react";
import authService, { type AuthResponse } from "@/services/authService";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  roles: string[];
}

interface AuthContextType {
  user: UserProfile | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  accessToken: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function saveSession(auth: AuthResponse) {
  localStorage.setItem("access_token", auth.accessToken);
  localStorage.setItem(
    "user_profile",
    JSON.stringify({
      id: auth.userId,
      email: auth.email,
      fullName: auth.fullName,
      avatarUrl: null,
      roles: auth.roles ?? [],
    } satisfies UserProfile)
  );
}

function clearSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_profile");
}

function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem("user_profile");
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(loadProfile);
  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem("access_token")
  );
  const [isLoading, setIsLoading] = useState(false);

  const refreshProfile = useCallback(() => {
    setProfile(loadProfile());
    setAccessToken(localStorage.getItem("access_token"));
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      setIsLoading(true);
      try {
        const auth = await authService.login(email, password);
        saveSession(auth);
        const p: UserProfile = {
          id: auth.userId,
          email: auth.email,
          fullName: auth.fullName,
          avatarUrl: null,
          roles: auth.roles ?? [],
        };
        setProfile(p);
        setAccessToken(auth.accessToken);
        return { error: null };
      } catch (err: any) {
        const message: string =
          err?.response?.data?.message ?? err?.message ?? "Login failed";
        return { error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string
    ): Promise<{ error: string | null }> => {
      setIsLoading(true);
      try {
        const auth = await authService.register(email, password, fullName);
        saveSession(auth);
        const p: UserProfile = {
          id: auth.userId,
          email: auth.email,
          fullName: auth.fullName,
          avatarUrl: null,
          roles: auth.roles ?? [],
        };
        setProfile(p);
        setAccessToken(auth.accessToken);
        return { error: null };
      } catch (err: any) {
        const message: string =
          err?.response?.data?.message ?? err?.message ?? "Registration failed";
        return { error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // swallow — clear local state regardless
    } finally {
      clearSession();
      setProfile(null);
      setAccessToken(null);
    }
  }, []);

  // If access token disappears (e.g. cleared by interceptor), sync state
  useEffect(() => {
    const onStorage = () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setProfile(null);
        setAccessToken(null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const roles = profile?.roles ?? [];
  const isAdmin = roles.includes("ADMIN") || roles.includes("admin");

  return (
    <AuthContext.Provider
      value={{
        user: profile,
        profile,
        isLoading,
        isAdmin,
        accessToken,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
