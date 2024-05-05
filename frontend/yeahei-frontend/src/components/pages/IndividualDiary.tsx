import { useState, useEffect } from 'react';
import { useGetDiary } from '../../hooks/useGetDiary';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import axios from 'axios';

import { Card } from '../atoms/Card';
import { LoadingScreen } from '../molecules/LogingScreen';

interface Diary {
    id: string;
    date: string;
    title: string;
    content: string;
    image?: { cloudinaryURL: string };
    translate?: { title: string; content: string };
    formattedDate?: string;
}

function formatDiaryDate(dateString: string): string {
    const date = new Date(dateString);
    return format(date, 'yyyy/MM/dd HH:mm');
}

const IndividualDiary = () => {
    const { id } = useParams<{ id: string }>(); // useParamsに型パラメータを提供
    const { getDiary } = useGetDiary();
    const [diary, setDiary] = useState<Diary | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDiary = async () => {
            if(!id) return;
            const diaryResponse = await getDiary(id);
            if (diaryResponse) {
                const formattedDate = formatDiaryDate(diaryResponse.date);
                const updatedDiary = {
                    ...diaryResponse,
                    formattedDate: formattedDate,
                };
                setDiary(updatedDiary);
            }
        };
        fetchDiary();
    }, [id, getDiary]);

    const onClickDeleteDiary = async () => {
        try {
            const res = await axios.delete(`http://localhost:3001/api/deleteDiary/${id}`);
            console.log(res);
            if (res.status === 200) {
                navigate('/');
            } else {
                navigate('/500');
            }
        } catch (error) {
            console.error(error);
            navigate('/500');
        }
    }
    if (!diary) {
        return <LoadingScreen />;
    }

    return (
        <div className='custom-bg w-full min-h-screen'>
            <div className="container mx-auto">
                <p className='date-style mt-8'>{diary.formattedDate}</p>
                <Card>
                    <div className="md:grid md:grid-cols-12">
                        <div className="lg:col-span-3"></div>
                        <div className="flex col-span-12 my-4 lg:col-span-6 justify-center">
                            <img src={diary.image?.cloudinaryURL} alt='自動生成された日記の画像' className="w-full h-auto" />
                        </div>
                        <div className="lg:col-span-3"></div>
                        <div className='col-span-12 py-3 border-b pr-4'>
                            <h3 className="text-lg font-semibold">{diary.title}</h3>
                            <p className="text-gray-700">{diary.content}</p>
                        </div>
                        <div className="col-span-12 py-4 pr-4">
                            <h3 className="text-md font-semibold">{diary.translate?.title}</h3>
                            <p className="text-gray-600">{diary.translate?.content}</p>
                        </div>
                    </div>
                </Card>
                <div className="flex justify-end pb-8">
                    <button onClick={() => navigate('/')} className="success-button mr-4">マイページに戻る</button>
                    <button onClick={onClickDeleteDiary} className="delete-button">日記を削除する</button>
                </div>
            </div>
        </div>
    );
}

export default IndividualDiary;
