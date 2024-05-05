import React, { useContext, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../providers/AuthProvider';

interface User {
    _id: string;
    username: string;
    email: string;
}


const UserRegister = () => {
    const { setUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleClick = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const username = (e.currentTarget.elements.namedItem('username') as HTMLInputElement).value;
        const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
        const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;

        axios.post<{ user: User }>('http://localhost:3001/api/register', { username, email, password })
            .then(response => {
                console.log(response);
                if (response.status === 201) { // ステータスコード201を登録成功と見なす
                    setUser(response.data.user);
                    navigate('/');
                } else {
                    navigate('/register');
                }
            })
            .catch(error => {
                console.error(error);
                navigate('/500');
            });
    }

    return (
        <div className='custom-bg w-full min-h-screen'>
            <form onSubmit={handleClick} className="form-container">
                <div className="mb-4">
                    <label htmlFor="username" className="form-label">ユーザ名</label>
                    <input type="text" id="username" name='username' className="form-input" required />
                </div>
                <div className="mb-4">
                    <label htmlFor="email" className="form-label">メールアドレス</label>
                    <input type="email" id="email" name='email' className="form-input" required />
                </div>
                <div className="mb-6">
                    <label htmlFor="password" className="form-label">パスワード</label>
                    <input type="password" id="password" name='password' className="form-input" required />
                </div>
                <button type="submit" className="form-button">登録</button>
            </form>
        </div>
    );
};

export default UserRegister;
