import { Request, Response, NextFunction } from 'express';

// 引数として非同期関数を取り、同じシグネチャを持つ新しい関数を返す
const catchAsync = (func: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    func(req, res, next).catch(next);
  };
};

export default catchAsync;
