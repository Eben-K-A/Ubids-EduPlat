import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { User, AuthState, LoginCredentials, RegisterData, UserRole } from "@/types/auth";

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user storage (will be replaced with real backend later)
const STORAGE_KEY = "edu_platform_user";

// Mock users for demo
const mockUsers: Record<string, { password: string; user: User }> = {
  "lecturer@edu.com": {
    password: "password123",
    user: {
      id: "1",
      email: "lecturer@edu.com",
      firstName: "John",
      lastName: "Smith",
      role: "lecturer" as UserRole,
      createdAt: new Date(),
    },
  },
  "student@edu.com": {
    password: "password123",
    user: {
      id: "2",
      email: "student@edu.com",
      firstName: "Jane",
      lastName: "Doe",
      role: "student" as UserRole,
      createdAt: new Date(),
    },
  },
  "admin@edu.com": {
    password: "password123",
    user: {
      id: "3",
      email: "admin@edu.com",
      firstName: "Admin",
      lastName: "User",
      role: "admin" as UserRole,
      createdAt: new Date(),
    },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored) as User;
        setState({ user, isAuthenticated: true, isLoading: false });
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const mockUser = mockUsers[credentials.email.toLowerCase()];
    if (!mockUser || mockUser.password !== credentials.password) {
      throw new Error("Invalid email or password");
    }

    const user = mockUser.user;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setState({ user, isAuthenticated: true, isLoading: false });
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<void> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (mockUsers[data.email.toLowerCase()]) {
      throw new Error("Email already registered");
    }

    const user: User = {
      id: crypto.randomUUID(),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      createdAt: new Date(),
    };

    // Store in mock users (won't persist across refreshes)
    mockUsers[data.email.toLowerCase()] = { password: data.password, user };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setState({ user, isAuthenticated: true, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
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
