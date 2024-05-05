import React from 'react';

// propsの型定義
interface CardProps {
    children: React.ReactNode;
}

// Cardコンポーネントの定義
export const Card: React.FC<CardProps> = ({ children }) => {
    return <div className="Card">{children}</div>;
};
