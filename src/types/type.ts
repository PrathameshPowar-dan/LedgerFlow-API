import { Document, Types } from "mongoose";

export interface AccountType extends Document {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    status: "ACTIVE" | "FROZEN" | "CLOSED";
    currency: string;
    GetBalance: () => Promise<number>;
}

export interface UserType extends Document {
    _id: Types.ObjectId;
    name: string;
    email: string;
    password?: string;
    systemUser: boolean,
    GenerateAuthToken: () => string;
    comparePassword: (candidatePassword: string) => Promise<boolean>;
}

type OptionsType = {
    maxAge: number;
    httpOnly: boolean;
    sameSite: "strict" | "lax" | "none";
    secure: boolean;
}

export type { OptionsType };