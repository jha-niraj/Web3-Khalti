"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { isLoggedIn, accountExists, getCurrentUser, type User } from '@/lib/userUtils';

interface AuthContextType {
    isAuthenticated: boolean;
    hasAccount: boolean;
    user: User | null;
    loading: boolean;
    refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [hasAccount, setHasAccount] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshAuth = async () => {
        setLoading(true);
        try {
            const accountExistsResult = accountExists();
            const isLoggedInResult = isLoggedIn();
            
            setHasAccount(accountExistsResult);
            setIsAuthenticated(isLoggedInResult);

            if (isLoggedInResult) {
                const currentUser = await getCurrentUser();
                setUser(currentUser);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Error refreshing auth state:', error);
            setIsAuthenticated(false);
            setHasAccount(false);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshAuth();
    }, []);

    // Listen for storage changes (useful for multi-tab scenarios)
    useEffect(() => {
        const handleStorageChange = () => {
            refreshAuth();
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const value: AuthContextType = {
        isAuthenticated,
        hasAccount,
        user,
        loading,
        refreshAuth,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}