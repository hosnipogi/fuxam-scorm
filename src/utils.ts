import { NextFunction, Request, Response } from "express";

export function authorizationMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.get("Authorization");
    if (!authHeader?.startsWith("Bearer") || authHeader.length <= 7) {
      throw new HttpError("Unauthorized", 401);
    }

    if (authHeader.substring(7) !== "secret") {
      throw new HttpError("Unauthorized", 401);
    }

    next();
  } catch (e) {
    next(e);
  }
}

export class HttpError extends Error {
  constructor(public readonly message: string, public readonly status = 400) {
    super(message);
    this.name = HttpError.name;
  }
}
