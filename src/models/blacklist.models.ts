import mongoose, { model, Schema, Document } from "mongoose";

export interface ITokenBlacklist extends Document {
    token: string;
    createdAt: Date;
}

const tokenBlacklistSchema = new Schema<ITokenBlacklist>({
    token: {
        type: String,
        required: [true, "Token is required to blacklist"],
        unique: true
    }
}, {
    timestamps: true
});

// TTL index to automatically delete the token document after 3 days (expires the blacklist)
tokenBlacklistSchema.index({ createdAt: 1 }, {
    expireAfterSeconds: 60 * 60 * 24 * 3
});

const TokenBlacklist = model<ITokenBlacklist>("TokenBlacklist", tokenBlacklistSchema);

export default TokenBlacklist;