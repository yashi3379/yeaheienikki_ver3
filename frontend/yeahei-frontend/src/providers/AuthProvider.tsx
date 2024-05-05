import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { LoadingScreen } from '../components/molecules/LogingScreen';

// ユーザー情報とセッター関数の型定義
interface User {
    _id: string;
    email?: string;
    username?: string; // passport-local-mongoose が提供
    password?: string; // 実際には保存されるハッシュ
}

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
}

// createContextの型を正確に指定
const defaultContextValue: AuthContextType = { user: null, setUser: () => { } };
export const AuthContext = createContext<AuthContextType>(defaultContextValue);

type Props = {
    children: React.ReactNode;
};

export const AuthProvider: React.FC<Props> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            console.log("---- useEffect ----");
            try {
                const response = await axios.get('http://localhost:3001/api/check-session');
                if (response.data.authenticated) {
                    setUser(response.data.user);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Session check failed:', error);
                setUser(null);
            } finally {
                setIsReady(true);
            }
        };

        checkSession();
    }, [setUser, setIsReady]);

    if (!isReady) {
        return <LoadingScreen />;
    }

    return (
        <AuthContext.Provider value={{ user, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};
