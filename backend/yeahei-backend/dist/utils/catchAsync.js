"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// 引数として非同期関数を取り、同じシグネチャを持つ新しい関数を返す
const catchAsync = (func) => {
    return (req, res, next) => {
        func(req, res, next).catch(next);
    };
};
exports.default = catchAsync;
