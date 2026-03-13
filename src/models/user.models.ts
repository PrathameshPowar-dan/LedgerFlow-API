import { model, Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema({
    name: {
        type: String,
        required: [true, "Name is Required for Account Creation"]
    },
    email: {
        type: String,
        required: [true, "Email is Required"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid Address"]
    },
    password: {
        type: String,
        required: [true, "Password is Required for Account Creation"],
        minlength: [6, "Password must contain atleast 6 Characters"],
        select: false
    },
    systemUser: {
        type: Boolean,
        default: false,
        immutable: true,
        select: false
    }
}, { timestamps: true });

userSchema.pre("save", async function () {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.GenerateAuthToken = function (): string {
    return jwt.sign({
        _id: this._id,
    },
        process.env.JWT_SECRET_KEY || "secretkey",
        { expiresIn: "24h" }
    );
}

const User = model("Users", userSchema);
export default User;