"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const catchAsync = (fn) => {
    return (req, res) => {
        fn(req, res).catch((error) => {
            console.error("An error occurred:", error);
            if (res.headersSent) {
                return;
            }
            res.status(500).json({ message: "Internal Server Error", error: error.message });
        });
    };
};
exports.default = catchAsync;
