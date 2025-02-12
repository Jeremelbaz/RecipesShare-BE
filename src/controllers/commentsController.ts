import commentModel, { IComments } from "../models/comments_model";
import { Request, Response } from "express";
import BaseController from "./base_controller";
import ExtendedRequest from "../interface";


class CommentsController extends BaseController<IComments> {
    constructor() {
        super(commentModel);
    }

    async create(req: ExtendedRequest, res: Response) {
        try {
            const { content, postId } = req.body;
            const ownerId = req.user?._id;
            const newComment = await this.model.create({ 
                content,
                postId,
                owner: ownerId,
            });

            res.status(201).json(newComment);
        } catch (error) {
            console.error("Error creating comment:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            res.status(400).json({ message: "Bad Request", error: errorMessage });
        }
    }
}

export default new CommentsController();