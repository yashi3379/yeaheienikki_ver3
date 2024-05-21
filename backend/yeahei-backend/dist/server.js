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
const cloudinary_1 = __importDefault(require("./cloudinary"));
const user_1 = __importDefault(require("./models/user"));
const diary_1 = __importDefault(require("./models/diary"));
const catchAsync_1 = __importDefault(require("./utils/catchAsync"));
const app = (0, express_1.default)();
const port = 3001;
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
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // ここを修正
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
        const registeredUser = await new Promise((resolve, reject) => {
            user_1.default.register(newUser, password, (err, user) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(user);
                }
            });
        });
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
//ログアウト機能
app.post('/api/logout', (0, catchAsync_1.default)(async (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: "ログアウトエラー" });
        }
        req.session.destroy((err) => {
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
app.post('/api/createDiary', (0, catchAsync_1.default)(async (req, res) => {
    if (!req.isAuthenticated()) {
        res.status(401).json({ message: "認証されていません" });
        return;
    }
    if (!req.body) {
        res.status(400).json({ message: "無効な日記です" });
        return;
    }
    const cloudinaryUpload = async (image) => {
        const result = await cloudinary_1.default.uploader.upload(image, {
            upload_preset: 'yeah-diary-ver3'
        });
        return result;
    };
    const translation = async (prompt) => {
        const translationResult = await translator.translateText(prompt, 'ja', 'en-US');
        return translationResult.text;
    };
    const generateImageURL = async (prompt) => {
        try {
            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt,
                n: 1,
                size: "1792x1024"
            });
            if (response.data && response.data.length > 0 && response.data[0].url) {
                return response.data[0].url;
            }
            else {
                console.error("No image URL found in the response");
                return undefined;
            }
        }
        catch (error) {
            console.error("Error generating image:", error);
            return undefined;
        }
    };
    const diary = new diary_1.default({
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
app.get('/api/getDiary', (0, catchAsync_1.default)(async (req, res) => {
    if (!req.isAuthenticated()) {
        res.status(401).json({ message: "認証されていません" });
        return;
    }
    const userId = req.query.userId; // userIdをクエリから取得し、string型として扱う
    const diaries = await diary_1.default.find({ author: userId }); // MongoDBから日記を検索
    res.status(200).json({ message: "日記を取得しました", diaries: diaries });
}));
//日記個別取得する
app.get('/api/getDiary/:id', (0, catchAsync_1.default)(async (req, res) => {
    if (!req.isAuthenticated()) {
        res.status(401).json({ message: "認証されていません" });
        return;
    }
    const id = req.params.id; // パスパラメータからIDを取得
    const diary = await diary_1.default.findById(id); // MongoDBから日記を検索
    if (!diary) {
        res.status(404).json({ message: "日記が見つかりません" });
        return;
    }
    res.status(200).json({ message: "日記を取得しました", diary: diary });
}));
//今後改良予定
//日記を5件ごとにページングして取得するAPI
app.get('/api/getDiary_page', (0, catchAsync_1.default)(async (req, res) => {
    if (!req.isAuthenticated()) {
        res.status(401).json({ message: "認証されていません" });
        return;
    }
    const userId = req.query.userId; // ユーザーIDをクエリパラメータから取得
    const page = parseInt(req.query.page) || 1; // ページ番号（デフォルトは1）
    const limit = 5; // ページあたりのアイテム数を5に固定
    const skip = (page - 1) * limit; // スキップするドキュメント数を計算
    try {
        const diaries = await diary_1.default.find({ author: userId })
            .skip(skip) // 最初のn個をスキップ
            .limit(limit); // 次のn個を取得
        // 総日記数を取得（ページネーションのため）
        const totalCount = await diary_1.default.countDocuments({ author: userId });
        res.status(200).json({
            message: "日記を取得しました",
            diaries: diaries,
            totalDiaries: totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit), // 総ページ数
            limit: limit
        });
    }
    catch (error) {
        console.error("データベースエラー:", error);
        res.status(500).json({ message: "データの取得中にエラーが発生しました" });
    }
}));
app.listen(port, () => {
    console.log(`サーバーがポート${port}で起動しました`);
});
