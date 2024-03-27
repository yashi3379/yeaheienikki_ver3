import { IUser } from '../models/user'; // IUserのパスを適切に設定してください

declare global {
  namespace Express {
    interface User extends IUser {} // ExpressのUserインターフェースをIUserで拡張

    interface Request {
      user?: User; // Requestのuserプロパティをオプショナルで定義
    }
  }
}