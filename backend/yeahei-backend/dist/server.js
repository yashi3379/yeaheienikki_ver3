"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const method_override_1 = __importDefault(require("method-override"));
const openai_1 = require("openai");
const openai = new openai_1.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const deepl_node_1 = require("deepl-node");
const translator = new deepl_node_1.Translator(process.env.DEEPL_API_KEY);
const user_1 = __importDefault(require("./models/user"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, method_override_1.default)('_method'));
mongoose_1.default.connect('mongodb://localhost:27017/yeah-diary-ver3')
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
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};
app.use((0, express_session_1.default)(sessionConfig));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
passport_1.default.use(new passport_local_1.Strategy(user_1.default.authenticate()));
passport_1.default.serializeUser(user_1.default.serializeUser());
passport_1.default.deserializeUser(user_1.default.deserializeUser());
//セッションがあるかどうかを確認
app.get('/api/check-session', (req, res) => {
    if (req.isAuthenticated()) {
        // req.userはIUser型であると推論されます
        res.json({ authenticated: true, user: req.user });
    }
    else {
        res.json({ authenticated: false });
    }
});
// ユーザー登録
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new user_1.default({ username, email });
        const registeredUser = await user_1.default.register(newUser, password);
        // req.login をプロミス化して async/await を使用
        await new Promise((resolve, reject) => {
            req.login(registeredUser, (err) => {
                if (err)
                    reject(err);
                resolve(registeredUser);
            });
        });
        // 登録とログインが成功
        return res.status(201).json({ message: "登録成功", user: req.user });
    }
    catch (e) {
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
        }
        else {
            // 不明なエラー
            return res.status(500).json({ message: "不明なエラーが発生しました。" });
        }
    }
});
// ログイン機能
app.post('/api/login', (req, res, next) => {
    passport_1.default.authenticate('local', (err, user) => {
        if (err) {
            // システムエラーが発生した場合（例: データベース接続エラー）
            console.error(err); // エラーログを記録
            return res.status(500).json({ message: "認証プロセス中にエラーが発生しました。" });
        }
        if (!user) {
            // ユーザー認証が失敗した場合（ユーザーが見つからない、パスワードが間違っている等）
            return res.status(401).json({ message: "ユーザーネームまたはパスワードが正しくありません。" });
        }
        req.logIn(user, (err) => {
            if (err) {
                console.error(err); // エラーログを記録
                return res.status(500).json({ message: "ログイン処理中にエラーが発生しました。" });
            }
            // ログイン成功
            return res.status(200).json({ message: "ログイン成功", user: req.user });
        });
    })(req, res, next);
});