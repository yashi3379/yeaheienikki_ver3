import React, { ReactNode, useContext } from "react";
import { Navigate } from "react-router-dom";
import { Header } from "../organisms/layout/Header";
import { AuthProvider, AuthContext } from "../../providers/AuthProvider";

// Propsの型定義を追加
interface ContentProps {
    children: ReactNode;
    isPublic: boolean;
}

const Content = ({ children, isPublic }: ContentProps) => {
    console.log({ children, isPublic });
    const { user } = useContext(AuthContext);

    if (!isPublic && !user) {
        // ユーザーがログインしていない場合はログインページにリダイレクト
        return <Navigate to="/login" />;
    }

    return (
        <>
            <Header />
            {children}
        </>
    );
};

// Propsの型定義を追加
interface DefaultTempProps {
    children: ReactNode;
    isPublic?: boolean; // オプショナルプロパティとして定義
}

export const DefaultTemp = ({ children, isPublic = false }: DefaultTempProps) => {
    return (
        <AuthProvider>
            <Content isPublic={isPublic}>
                {children}
            </Content>
        </AuthProvider>
    );
};
