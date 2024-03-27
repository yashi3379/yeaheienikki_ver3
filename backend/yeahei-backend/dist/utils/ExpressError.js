"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ExpressError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message); // Errorクラスのコンストラクタにメッセージを渡す
        this.statusCode = statusCode;
        this.name = 'ExpressError'; // エラー名を設定
        // V8スタックトレースのキャプチャを改善（Errorの継承時に有効）
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ExpressError);
        }
    }
}
exports.default = ExpressError;
