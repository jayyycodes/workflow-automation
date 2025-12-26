'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        console.log('🔍 [AUTH] Starting auth check...');
        try {
            const token = api.getToken();
            console.log('🔍 [AUTH] Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'null');

            if (token) {
                console.log('🔍 [AUTH] Calling /auth/me...');
                const userData = await api.request('/auth/me');
                console.log('✅ [AUTH] Success! User data:', userData);
                setUser(userData.user);
            } else {
                console.log('⚠️ [AUTH] No token found');
            }
        } catch (error) {
            console.error('❌ [AUTH] Auth check failed:', error);
            console.error('❌ [AUTH] Error details:', error.message);
            // DON'T clear token - let user try again
            // api.clearToken();
        } finally {
            setLoading(false);
            console.log('🔍 [AUTH] Auth check complete. Loading:', false);
        }
    };

    const login = async (email, password) => {
        const data = await api.login(email, password);
        setUser(data.user);
        return data;
    };

    const register = async (name, email, password, whatsappNumber) => {
        const data = await api.register(email, password, name, whatsappNumber);
        setUser(data.user);
        return data;
    };

    const logout = () => {
        api.logout();
        setUser(null);
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            register,
            logout,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
