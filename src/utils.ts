import { NextFunction, Request, Response } from "express";

export function authorizationMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.get("Authorization");
    if (!authHeader?.startsWith("Bearer") || authHeader.length <= 7) {
      throw new Error("Unauthorized");
    }

    if (authHeader.substring(7) !== "secret") {
      throw new Error("Unauthorized");
    }

    next();
  } catch (e) {
    next(e);
  }
}
