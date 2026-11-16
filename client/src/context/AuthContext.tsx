import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api } from '../services/api';
import { disconnectSocket } from '../services/socket';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { emailOrUsername: string; password: string }) => Promise<void>;
  register: (userData: { username: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('discordx_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check existing token and fetch user
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.auth.getMe();
          setUser(res.user);
        } catch (error) {
          console.warn('[Auth] Session expired or invalid token:', error);
          localStorage.removeItem('discordx_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (credentials: { emailOrUsername: string; password: string }) => {
    const data = await api.auth.login(credentials);
    localStorage.setItem('discordx_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (userData: { username: string; email: string; password: string }) => {
    const data = await api.auth.register(userData);
    localStorage.setItem('discordx_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('discordx_token');
    setToken(null);
    setUser(null);
    disconnectSocket();
  };

  const updateUser = (updatedData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updatedData });
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
