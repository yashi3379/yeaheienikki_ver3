class ExpressError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message); // Errorクラスのコンストラクタにメッセージを渡す
        this.statusCode = statusCode;
        this.name = 'ExpressError'; // エラー名を設定

        // V8スタックトレースのキャプチャを改善（Errorの継承時に有効）
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ExpressError);
        }
    }
}

export default ExpressError;
