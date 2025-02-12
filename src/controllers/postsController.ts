import postModel, { IPost } from "../models/posts_model";
import { Request, Response } from "express";
import BaseController from "./base_controller";
import { UploadedFile } from "express-fileupload";
import path from "path";
import ExtendedRequest from "../interface";
import { analyzeRecipeHelper } from "./analyzer_helper";

class PostsController extends BaseController<IPost> {
    constructor() {
        super(postModel);
    }

    async create(req: ExtendedRequest, res: Response) { 
        try {
          const { title, content } = req.body;
          const ownerId = req.user?._id;
          console.log(ownerId)
          let imagePath: string | undefined = undefined;
    
          if (req.files && req.files.image) {
            const image = req.files.image as UploadedFile;
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const filename = image.name + '-' + uniqueSuffix;
            const uploadPath = path.join(__dirname, '..', 'uploads', filename);
    
            await image.mv(uploadPath);
            imagePath = `/uploads/${filename}`;
          }
          
          const newPost = await this.model.create({ 
            title,
            content,
            owner: ownerId, 
            image: imagePath,
          });
    
          res.status(201).json(newPost);
        } catch (error) {
          console.error("Error creating post:", error);
          const errorMessage = (error as Error).message;
          res.status(400).json({ message: "Bad Request", error: errorMessage });
        }
      }

    async updateItem(req: Request, res: Response) { // Override updateItem for image handling
        try {
            const id = req.params.id;
            const body = req.body;

            if (req.files && req.files.image) {
                const image = req.files.image as UploadedFile;
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const filename = image.name + '-' + uniqueSuffix;
                const uploadPath = path.join(__dirname, '..', 'uploads', filename);

                await image.mv(uploadPath);
                body.image = `/uploads/${filename}`;
            }

            const updatedPost = await this.model.findByIdAndUpdate(id, body, { new: true, runValidators: true }).populate('owner');

            if (!updatedPost) {
                return res.status(404).json({ message: "Not Found" });
            }

            res.json(updatedPost);
        } catch (error) {
            console.error("Error in updateItem:", error);
            const errorMessage = (error as Error).message;
            res.status(400).json({ message: "Bad Request", error: errorMessage });
        }
    }

    async likePost(req: ExtendedRequest, res: Response) {
        try {
          const postId = req.params.id;
          const userId = req.user?._id;
    
          if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
          }
    
          const post = await this.model.findById(postId);
    
          if (!post) {
            return res.status(404).json({ message: "Post not found" });
          }
    
          if (post.likes.includes(userId)) {
            await this.model.findByIdAndUpdate(postId, { $pull: { likes: userId } }, { new: true });
          } else {
            await this.model.findByIdAndUpdate(postId, { $push: { likes: userId } }, { new: true });
          }
    
          const updatedPost = await this.model.findById(postId).populate('owner').populate('likes'); 
          res.status(200).json(updatedPost);
    
        } catch (error) {
          console.error("Error liking/unliking post:", error);
          res.status(500).json({ message: "Server Error" });
        }
    }

    async analyzeRecipe(req: Request, res: Response) {
        try {
          const postId = req.params.id;
          const post = await this.model.findById(postId);
          if (!post) {
            return res.status(404).json({ message: "Post not found" });
          }
          const analysis = await analyzeRecipeHelper(post.toJSON().content);
      
          res.status(200).json({ analysis });
        } catch (error) {
          console.error("Error analyzing recipe:", error);
          res.status(500).json({ message: "Server Error" });
        }
    }

}    

export default new PostsController();
