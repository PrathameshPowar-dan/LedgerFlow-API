import { Request, Response } from "express";
import { asyncHandler } from "../../utils/AsyncHandler";
import User from "../../models/user.models";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { OptionsType, UserType } from "../../types/type";

const isProduction = process.env.NODE_ENV === 'production';

// const options: OptionsType = {
//     maxAge: 7 * 24 * 60 * 60 * 1000,
//     httpOnly: true,
//     sameSite: "strict",
//     secure: isProduction,
// }


// Register User
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    const requiredFields = { email, username, password };

    for (const [fieldName, fieldValue] of Object.entries(requiredFields)) {
        if (typeof fieldValue !== 'string' || !fieldValue.trim()) {
            throw new ApiError(400, `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`);
        }
    }

    if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters")
    }

    const ExistingUser = await User.findOne({
        email: email.toLowerCase()
    })

    if (ExistingUser) {
        throw new ApiError(409, "User Already Exists")
    }

    const user = await User.create({
        name: username,
        email: email.toLowerCase(),
        password
    });

    const Token = (user as unknown as UserType).GenerateAuthToken();

    const CreatedUser = await User.findById(user._id).select("-password")

    if (!CreatedUser) {
        throw new ApiError(500, "Something went wrong creating User")
    }

    return res
        .status(201)
        .cookie("Token", Token)
        .json(
            new ApiResponse(201, CreatedUser, "User Registered Successfully")
        )
});


// Login User
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (typeof email !== 'string' || !email.trim()) {
        throw new ApiError(400, "Email is required");
    }

    if (typeof password !== 'string' || !password.trim()) {
        throw new ApiError(400, "Password is required");
    }

    const user = await User.findOne({
        email: email.toLowerCase()
    }).select("+password");

    if (!user) {
        throw new ApiError(404, "User Not Found")
    }

    const isMatch = await (user as unknown as UserType).comparePassword(password);

    if (!isMatch) {
        throw new ApiError(401, "Invalid Credentials")
    }

    const Token = (user as unknown as UserType).GenerateAuthToken();

    const LoggedInUser = await User.findById(user._id).select("-password")

    if (!LoggedInUser) {
        throw new ApiError(500, "Something went wrong logging in User")
    }

    return res
        .status(200)
        .cookie("Token", Token)
        .json(
            new ApiResponse(200, LoggedInUser, "User Logged In Successfully")
        )
});


// Logout User
export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
    res.clearCookie("Token");
    return res.status(200).json(
        new ApiResponse(200, null, "User Logged Out Successfully")
    )
});