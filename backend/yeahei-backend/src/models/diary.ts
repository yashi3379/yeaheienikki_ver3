import mongoose, { Document, Schema } from 'mongoose';

export interface IDiary extends Document {
    title: string;
    content: string;
    date: string;
    translate: {
        title: string;
        content: string;
    };
    image: {
        _id: string;
        cloudinaryURL: string;
    };
    author: Schema.Types.ObjectId;
}

const DiarySchema: Schema = new Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    date: {
        type: String,
    },
    translate: {
        title: String,
        content: String
    },
    image: {
        _id: String,
        cloudinaryURL: String
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

// Mongooseモデルの生成時にインターフェースを適用
const Diary = mongoose.model<IDiary>('Diary', DiarySchema);

export default Diary;
