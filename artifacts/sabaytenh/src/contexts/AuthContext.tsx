import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("sabaytenh_token");
    const storedUser = localStorage.getItem("sabaytenh_user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setAuthTokenGetter(() => storedToken);
      } catch (e) {
        localStorage.removeItem("sabaytenh_token");
        localStorage.removeItem("sabaytenh_user");
      }
    } else {
      setAuthTokenGetter(() => null);
    }
    setIsReady(true);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("sabaytenh_token", newToken);
    localStorage.setItem("sabaytenh_user", JSON.stringify(newUser));
    setAuthTokenGetter(() => newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("sabaytenh_token");
    localStorage.removeItem("sabaytenh_user");
    setAuthTokenGetter(() => null);
  };

  if (!isReady) {
    return null; // Or a full page spinner
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
