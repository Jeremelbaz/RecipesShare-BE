import mongoose from "mongoose";

export interface IComments {
    content: string;
    owner: string; // ref to the _id of the user that created the comment
    postId: string; // _id of the post that the comment is about
    createdAt: Date; 
    updatedAt: Date; 
}

const commentsSchema = new mongoose.Schema<IComments>({
    content: {
        type: String,
        required: true,
    },
    owner: {
        type: String,
        required: true,
        ref: "users", 
    },
    postId: {
        type: String,
        required: true,
        ref: "Posts", 
    },
}, { timestamps: true });

const commentsModel = mongoose.model<IComments>("Comments", commentsSchema);

export default commentsModel;