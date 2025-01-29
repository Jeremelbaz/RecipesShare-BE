import mongoose from "mongoose";

export interface IPost {
    title: string;
    content: string;
    owner: string; // ref to user
    image?: string; // path to image in server
    likes: string[]; // array of users' ids that liked the post
    createdAt: Date; 
    updatedAt: Date; 
}

const postSchema = new mongoose.Schema<IPost>({
    title: {
        type: String,
        required: true,
    },
    content: String,
    owner: {
        type: String,
        required: true,
        ref: "users", // ref to users schema
    },
    image: {
        type: String,
    },
    likes: {
        type: [String],
        default: [],
        ref: "users", // ref to users schema
    },
}, { timestamps: true }); 

const postModel = mongoose.model<IPost>("Posts", postSchema);

export default postModel;