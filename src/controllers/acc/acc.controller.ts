import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/AsyncHandler";
import { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError";
import Account from "../../models/acc.models";

// Account Creation
export const CreateACC = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(401, "User not authenticated");
    }

    const account = await Account.create({
        user: user._id
    })

    res.status(201).json(
        new ApiResponse(201, account, "Account Created!")
    )
})