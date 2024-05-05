import React, { useContext, useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

import { AuthContext } from '../../providers/AuthProvider';
import { LoadingScreen } from '../molecules/LogingScreen';

import {useAppLocation} from '../../hooks/useAppLocation';

// AuthContextで使用するユーザーの型を定義
interface User {
    _id: string;
    username: string; // passport-local-mongoose が提供
}

// Location stateの型を定義

const CreateDiary: React.FC = () => {
    const { user } = useContext(AuthContext) as { user: User }; // useContextの型キャスティング
    const navigate = useNavigate();
    const location = useAppLocation();
    const message = location.state?.message;
    const [isLoading, setIsLoading] = useState(false);

    const onCreateDiary = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true); // ローディング開始
        const title = (e.currentTarget.elements.namedItem('title') as HTMLInputElement).value;
        const content = (e.currentTarget.elements.namedItem('content') as HTMLTextAreaElement).value;
        const userId = user._id;
        //もし日記のタイトルが5文字未満30文字以上の時、内容が20文字未満、300文字を超える場合はエラーメッセージを表示する
        if (title.length < 5 || title.length > 30) {
            navigate('/create', { state: { message: 'タイトルは5文字以上30文字以下で入力してください' } });
            return;
        }
        if (content.length < 20 || content.length > 300) {
            navigate('/create', { state: { message: '内容は20文字以上200文字以下で入力してください' } });
            return;
        }

        axios.post('http://localhost:3001/api/CreateDiary', { userId, title, content })
                
            .then(response => {
                console.log(response);
                if (response.status === 200) {
                    navigate('/');
                } else {
                    navigate('/create');
                }
            })
            .catch(error => {
                if (error.response && error.response.status === 401) {
                    navigate('/create', { state: { message: '日記の作成に失敗しました' } });
                } else {
                    console.log(error);
                    navigate('/500');
                }
            })
            .finally(() => {
                setIsLoading(false); // ローディング終了
            });
    };

    return (
        <div className='custom-bg w-full min-h-screen'>
            {isLoading && <LoadingScreen />}
            <h1 className="text-3xl font-bold mb-4 text-center mt-3">日記作成</h1>
            <h2 className="text-2xl font-bold my-4 text-center">Hello, {user.username}!</h2>
            <form onSubmit={onCreateDiary} className="form-container">
                {message && <p className="form-message">{message}</p>}
                <div className='mb-4'>
                    <label htmlFor="title" className='form-label'>タイトル</label>
                    <input type="text" id="title" name='title' minLength={5} className='form-input' />
                </div>
                <div className='mb-4'>
                    <label htmlFor="content" className='form-label'>内容</label>
                    <textarea name="content" id="content" cols={50} rows={4}
                        minLength={20} maxLength={200} required className='form-textarea'></textarea>
                </div>
                <button type="submit" className="form-button">日記を追加する!</button>
            </form>
            <Link to="/" className="text-lg text-blue-500 hover:text-blue-700 underline mb-4 text-center block w-full">Mypageに戻る</Link>
        </div>
    );
}

export default CreateDiary;
