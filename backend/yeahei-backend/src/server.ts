import dotenv from 'dotenv';
dotenv.config();
import express,{NextFunction, Request,Response} from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import methodOverride from 'method-override';
import { OpenAI } from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
import { Translator } from 'deepl-node';
const translator = new Translator(process.env.DEEPL_API_KEY!);
import cloudinary from './cloudinary';


import User, { IUser } from './models/user';
import Diary, { IDiary } from './models/diary';

import ExpressError from './utils/ExpressError';
import catchAsync from './utils/catchAsync';



const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(methodOverride('_method'));



mongoose.connect('mongodb://localhost:27017/yeah-diary-ver3')
    .then(() => console.log('コネクション接続成功'))
    .catch(err => {
        console.log('コネクション接続失敗');
        console.error(err);
    });


const sessionConfig = {
    secret: 'mysecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: false,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // ここを修正
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};


app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser() );

//Interface
interface CloudinaryResponse {
    secure_url: string;
}
interface AuthenticatedRequest extends Request {
    isAuthenticated: () => boolean;
}


//セッションがあるかどうかを確認
app.get('/api/check-session', (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
        // req.userはIUser型であると推論されます
        res.json({ authenticated: true, user: req.user });
    } else {
        res.json({ authenticated: false });
    }
});


// ユーザー登録
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new User({ username, email });
        const registeredUser = await User.register(newUser, password);

        // req.login をプロミス化して async/await を使用
        await new Promise((resolve, reject) => {
            req.login(registeredUser, (err) => {
                if (err) reject(err);
                resolve(registeredUser);
            });
        });

        // 登録とログインが成功
        return res.status(201).json({ message: "登録成功", user: req.user });

    } catch (e: unknown) {
        if (e instanceof Error) {
            // passport-local-mongoose の特定のエラーに基づいたカスタムレスポンス
            switch (e.name) {
                case "UserExistsError":
                    return res.status(409).json({ message: "ユーザーが既に存在しています。" });
                case "MissingUsernameError":
                case "MissingPasswordError":
                    return res.status(400).json({ message: e.message });
                default:
                    // その他のエラー
                    return res.status(500).json({ message: "サーバーエラーが発生しました。" });
            }
        } else {
            // 不明なエラー
            return res.status(500).json({ message: "不明なエラーが発生しました。" });
        }
    }
});

// ログイン機能
app.post('/api/login', (req: Request, res: Response, next:NextFunction) => {
    passport.authenticate('local', (err:Error, user:IUser) => {
      if (err) {
        // システムエラーが発生した場合（例: データベース接続エラー）
        console.error(err); // エラーログを記録
        return res.status(500).json({ message: "認証プロセス中にエラーが発生しました。" });
      }
      if (!user) {
        // ユーザー認証が失敗した場合（ユーザーが見つからない、パスワードが間違っている等）
        return res.status(401).json({ message: "ユーザーネームまたはパスワードが正しくありません。" });
      }
      req.logIn(user, (err:Error) => {
        if (err) {
          console.error(err); // エラーログを記録
          return res.status(500).json({ message: "ログイン処理中にエラーが発生しました。" });
        }
        // ログイン成功
        return res.status(200).json({ message: "ログイン成功", user: req.user  });
      });
    })(req, res, next);
  });

//ログアウト機能
app.post('/api/logout', catchAsync(async (req: Request, res: Response) => {
    req.logout((err: Error) => {
        if (err) {
            return res.status(500).json({ message: "ログアウトエラー" });
        }
        req.session.destroy((err: Error) => {
            if (err) {
                return res.status(500).json({ message: "セッション削除エラー" });
            }
            // セッションを削除した後、クライアントに成功メッセージを送信
            // クライアントサイドでセッションCookieを削除するために、
            // 必要に応じてSet-Cookieヘッダーを使用してCookieをクリアする
            res.clearCookie('connect.sid');
            return res.status(200).json({ message: "ログアウト成功" });
        });
    });
}));


//日記投稿機能
app.post('/api/createDiary', catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    
    if (!req.isAuthenticated()) {
        res.status(401).json({ message: "認証されていません" });
        return;
    }
    if (!req.body) {
        res.status(400).json({ message: "無効な日記です" });
        return;
    }

    const cloudinaryUpload = async (image: string): Promise<CloudinaryResponse> => {
        const result = await cloudinary.uploader.upload(image, {
            upload_preset: 'yeah-diary-ver3'
        });
        return result;
    };

    const translation = async (prompt: string): Promise<string> => {
        const translationResult = await translator.translateText(prompt, 'ja', 'en-US');
        return translationResult.text;
    };

    const generateImageURL = async (prompt: string): Promise<string | undefined> => {
        try {
            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt,
                n: 1,
                size: "1792x1024"
            });
            if (response.data && response.data.length > 0 && response.data[0].url) {
                return response.data[0].url;
            } else {
                console.error("No image URL found in the response");
                return undefined;
            }
        } catch (error) {
            console.error("Error generating image:", error);
            return undefined;
        }
    };

    const diary: IDiary = new Diary({
        title: req.body.title,
        content: req.body.content,
        date: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
        author: req.body.userId
    });

    const resultTransrateTitle = await translation(diary.title);
    const resultTransrateContent = await translation(diary.content);
    diary.translate = {
        title: resultTransrateTitle,
        content: resultTransrateContent
    };

    const DallEPrompt = `Illustrate '${diary.translate.title}' with elements from '${diary.translate.content}'. Emphasize mood, key actions, and symbols using appropriate colors and light.`;
    const aiImageURL = await generateImageURL(DallEPrompt);
    if (aiImageURL === undefined) {
        res.status(500).json({ message: "Failed to generate image URL." });
        return;
    }

    const cloudinaryResult = await cloudinaryUpload(aiImageURL);
    diary.image = {
        cloudinaryURL: cloudinaryResult.secure_url
    };

    await diary.save();
    res.status(200).json({ message: "日記を追加しました", diary });
}));


//日記全件取得
app.get('/api/getDiary', catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.isAuthenticated()) {
        res.status(401).json({ message: "認証されていません" });
        return;
    }
    const userId = req.query.userId as string;  // userIdをクエリから取得し、string型として扱う
    const diaries = await Diary.find({ author: userId });  // MongoDBから日記を検索
    res.status(200).json({ message: "日記を取得しました", diaries: diaries });
}));

//今後改良予定
//日記を5件ごとにページングして取得するAPI
app.get('/api/getDiary_page', catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.isAuthenticated()) {
        res.status(401).json({ message: "認証されていません" });
        return;
    }

    const userId = req.query.userId as string; // ユーザーIDをクエリパラメータから取得
    const page = parseInt(req.query.page as string) || 1; // ページ番号（デフォルトは1）
    const limit = 5; // ページあたりのアイテム数を5に固定
    const skip = (page - 1) * limit; // スキップするドキュメント数を計算

    try {
        const diaries = await Diary.find({ author: userId })
            .skip(skip) // 最初のn個をスキップ
            .limit(limit); // 次のn個を取得

        // 総日記数を取得（ページネーションのため）
        const totalCount = await Diary.countDocuments({ author: userId });

        res.status(200).json({
            message: "日記を取得しました",
            diaries: diaries,
            totalDiaries: totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit), // 総ページ数
            limit: limit
        });
    } catch (error) {
        console.error("データベースエラー:", error);
        res.status(500).json({ message: "データの取得中にエラーが発生しました" });
    }
}));
