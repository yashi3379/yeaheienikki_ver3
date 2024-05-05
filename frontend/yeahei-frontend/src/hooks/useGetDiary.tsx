import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// フック用にDiaryの型定義を追加
interface Diary {
    id: string;
    date: string;
    title: string;
    content: string;
    image: { cloudinaryURL: string };
    translate: { title: string; content: string };
}


export const useGetDiary = () => {
    const navigate = useNavigate();

    // IDを受け取り、Diary型のオブジェクトを非同期に返す関数
    const getDiary = async (id: string): Promise<Diary | undefined> => {
        console.log(id);
        try {
            const response = await axios.get<{ diary: Diary }>(`http://localhost:3001/api/getDiary/${id}`);
            console.log(response.data);
            return response.data.diary;
        } catch (error) {
            console.error(error);
            navigate("/500");
        }
    };

    return { getDiary };
}
