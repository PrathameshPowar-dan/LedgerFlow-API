import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/AsyncHandler";
import { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError";
import Account from "../../models/acc.models";
import { AccountType } from "../../types/type";

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
});

export const getUserAccounts = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, "User not authenticated");
    }

    const accounts = await Account.find({ user: req.user._id });

    return res.status(200).json(
        new ApiResponse(200, { accounts }, "User accounts retrieved successfully")
    );
});

// Get Specific Account Balance
export const getAccountBalance = asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = req.params;

    if (!req.user) {
        throw new ApiError(401, "User not authenticated");
    }

    if (!accountId) {
        throw new ApiError(400, "Account ID is required");
    }

    const account = await Account.findOne({
        _id: accountId,
        user: req.user._id
    });

    if (!account) {
        throw new ApiError(404, "Account not found or unauthorized access");
    }

    const balance = await (account as unknown as AccountType).GetBalance();

    return res.status(200).json(
        new ApiResponse(200, { accountId: account._id, balance }, "Account balance retrieved successfully")
    );
});
