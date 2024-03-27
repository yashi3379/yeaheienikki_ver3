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
import { v4 as uuidv4 } from 'uuid';

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




