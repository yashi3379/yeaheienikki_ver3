import mongoose, { Document, Schema, Model } from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

export interface IUser extends Document {
  //強制的にstring型にする
  email: string;
  username?: string; // passport-local-mongoose が提供
  password?: string; // 実際には保存されるハッシュ
}

interface IUserModel extends Model<IUser> {
  register(user: IUser, password: string, cb: (err: any, user: IUser) => void): void;
  authenticate(): any;
  serializeUser(): any;
  deserializeUser(): any;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true
  }
});

UserSchema.plugin(passportLocalMongoose, {
  usernameField: 'email',
  errorMessages: {
    IncorrectPasswordError: 'パスワードが間違っています。',
    IncorrectUsernameError: 'ユーザー名が間違っています。',
    MissingPasswordError: 'パスワードがありません。',
    MissingUsernameError: 'ユーザー名がありません。',
    UserExistsError: 'ユーザーが既に存在しています。',
    TooManyAttemptsError: 'アカウントがロックされました。しばらくしてから再度お試しください。',
    NoSaltValueStoredError: '認証に失敗しました。しばらくしてから再度お試しください。',
    AttemptTooSoonError: 'アカウントがロックされました。しばらくしてから再度お試しください。',
  }
});

const User = mongoose.model<IUser,IUserModel>('User', UserSchema);
export default User;
