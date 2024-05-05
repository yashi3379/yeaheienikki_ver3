import React, { useContext, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../providers/AuthProvider';
import { useAppLocation } from '../../hooks/useAppLocation'; // カスタムフックのインポート

interface User {
    _id: string;  
    username: string;
}

const Login = () => {
    const location = useAppLocation(); // カスタムフックの使用
    const message = location.state?.message;
    const navigate = useNavigate();
    const { setUser } = useContext(AuthContext);

    const handleClick = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const username = (e.currentTarget.elements.namedItem('username') as HTMLInputElement).value;
        const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;
        
        axios.post<{user:User}>('http://localhost:3001/api/login', { username, password })
            .then(response => {
                console.log(response);
                if (response.status === 200) {
                    console.log(response.data);
                    setUser(response.data.user);
                    navigate('/');
                } else {
                    navigate('/login');
                }
            })
            .catch(error => {
                console.error(error);
                if (error.response && error.response.status === 401) {
                    navigate('/login', { state: { message: 'ユーザー名またはパスワードが違います' } });
                    return;
                }
                navigate('/500');
            });
    }

    return (
        <div className='custom-bg w-full min-h-screen'>
            <div className='flex flex-col items-center justify-center mx-auto'>
                <h1 className="text-3xl font-bold mb-4">ログイン</h1>
                <form onSubmit={handleClick} className="form-container">
                    {message && <p className="form-message">{message}</p>}
                    <div className="mb-4">
                        <label htmlFor="username" className="form-label">ユーザーネーム</label>
                        <input type="text" id="username" name='username' className="form-input" />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="form-label">パスワード</label>
                        <input type="password" id="password" name='password' className="form-input" />
                    </div>
                    <button type="submit" className="form-button">ログイン</button>
                </form>
                <Link to="/register" className="font-medium text-blue-600 dark:text-blue-500 hover:underline">新規登録はこちら</Link>
            </div>
        </div>
    );
};

export default Login;
