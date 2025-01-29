import mongoose from "mongoose";

export interface IUser {
    email: string;
    password?: string;
    _id?: string;
    refreshToken?: string[];
    username: string;
    profileImage?: string; // Path to the image file
    googleId?: string; 
}

const userSchema = new mongoose.Schema<IUser>({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
    },
    refreshToken: {
        type: [String],
        default: [],
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    profileImage: {
        type: String,
    },
    googleId: {
        type: String,
    },
});

const userModel = mongoose.model<IUser>("users", userSchema);

export default userModel;