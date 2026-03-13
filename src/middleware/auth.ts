import { NextFunction, Request } from "express";
import User from "../models/user.models";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/AsyncHandler";
import JWT from "jsonwebtoken";
import { UserType } from "../types/type";

declare global {
    namespace Express {
        interface Request {
            user?: UserType;
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

        const user = await User.findById(DecodedToken?._id).select("-password") as UserType | null;

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, "Invalid Access Token");
    }
});

const AuthSystemUser = asyncHandler(async (req, res, next) => {

    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        throw new ApiError(401, "Unauthorized access, token is missing")
    }

    // const isBlacklisted = await tokenBlackListModel.findOne({ token })

    // if (isBlacklisted) {
    //     return res.status(401).json({
    //         message: "Unauthorized access, token is invalid"
    //     })
    // }

    try {
        const decoded = JWT.verify(token, process.env.JWT_SECRET_KEY || "secretkey") as { _id: string }

        const user = await User.findById(decoded?._id).select("+systemUser") as UserType | null;
        if (!user || !user.systemUser) {
            return res.status(403).json({
                message: "Forbidden access, not a system user"
            })
        }

        req.user = user

        return next()
    }
    catch (err) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
    }

})

export default { AuthToken, AuthSystemUser };