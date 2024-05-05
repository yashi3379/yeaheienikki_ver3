import { useContext } from "react";
import { AuthContext } from "../providers/AuthProvider";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface Diary {
    _id: string;
    date: string;
    title: string;
    content: string;
    image: { cloudinaryURL: string };
    translate: { title: string; content: string };
}




export const useGetAllDiaries = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // ユーザー情報の存在を確認し、ユーザーIDを安全に取得
    const userId = user?._id;
    if (!userId) {
        navigate("/login");
        throw new Error("User not logged in");
    }

    const getAllDiaries = async (): Promise<Diary[]> => {
        try {
            const res = await axios.get<{ diaries: Diary[] }>(`http://localhost:3001/api/getDiary?userId=${userId}`);
            console.log(res.data);
            return res.data.diaries;  
        } catch (error) {
            console.error(error);
            navigate("/500");
            throw error;  // 関数の外でエラーを処理できるように、ここでエラーを再スローします
        }
    };

    return { getAllDiaries };
}

