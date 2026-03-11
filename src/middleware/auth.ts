import { NextFunction, Request } from "express";
import User from "../models/user.models";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/AsyncHandler";
import JWT from "jsonwebtoken";
import { UserType } from "../types/type";

declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

const AuthToken = asyncHandler(async (req: Request, _, next: NextFunction) => {
    try {
        const Token = req.cookies?.Token || req.headers.authorization?.split(" ")[1];

        if (!Token) {
            throw new ApiError(401, "UNAUTHORIZED ACCESS");
        }

        const DecodedToken = JWT.verify(Token, process.env.JWT_SECRET_KEY || "secretkey") as { _id: string };

        const user = await User.findById(DecodedToken?._id).select("-password");

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, "Invalid Access Token");
    }
});

export default AuthToken;