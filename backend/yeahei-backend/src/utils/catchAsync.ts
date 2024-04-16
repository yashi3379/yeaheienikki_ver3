// catchAsync.ts
import { Request, Response } from 'express';

const catchAsync = (fn: (req: Request, res: Response) => Promise<void>) => {
  return (req: Request, res: Response): void => {
    fn(req, res).catch((error) => {
      console.error("An error occurred:", error);
      if (res.headersSent) {
        return;
      }
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    });
  };
};

export default catchAsync;

