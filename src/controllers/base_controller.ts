import { Request, Response } from "express";
import { Model } from "mongoose";
import ExtendedRequest from "../interface";


class BaseController<T> {
    model: Model<T>;
    constructor(model: Model<T>) {
        this.model = model;
    }

    async getAll(req: Request, res: Response) {
        const ownerFilter = req.query.owner;
        const postFilter = req.query.postId;
        try {
            if (postFilter) {
                const items = await this.model.find({postId: postFilter}).populate('owner');
                res.json(items);
            }
            else if (ownerFilter) {
                const items = await this.model.find({postId: ownerFilter}).populate('owner');
                res.json(items);
            }
            else {
                const items = await this.model.find().populate('owner');
                res.json(items);
            }
        } catch (error) {
            console.error("Error in getAll:", error);
            res.status(500).json({ message: "Server Error" });
        }
    }

    async getById(req: Request, res: Response) {
        const id = req.params.id;
        try {
            const item = await this.model.findById(id).populate('owner');
            if (!item) {
                return res.status(404).json({ message: "Not Found" });
            }
            res.json(item);
        } catch (error) {
            console.error("Error in getById:", error);
            res.status(500).json({ message: "Server Error" });
        }
    }

    async create(req: Request, res: Response) {
        try {
            const item = await this.model.create(req.body);
            res.status(201).json(item);
        } catch (error) {
            console.error("Error in create:", error);
            res.status(400).json({ message: "Bad Request", error: error.message });
        }
    }

    async updateItem(req: Request, res: Response) {
        const id = req.params.id;
        const body = req.body;
        try {
            if (!id || id.trim() == ""){
                return res.status(400).send("ID is required");
            }

            const updatedItem = await this.model.findByIdAndUpdate(id, body, { new: true, runValidators: true });

            if (!updatedItem) {
                return res.status(404).json({ message: "Not Found" });
            }

            res.json(updatedItem);
        } catch (error) {
            console.error("Error in updateItem:", error);
            res.status(400).json({ message: "Bad Request", error: error.message });
        }
    }

    async deleteItem(req: ExtendedRequest, res: Response) {
        const id = req.params.id;
        const userId = req.user?. _id;
        try {
            const deletedItem = await this.model.findByIdAndDelete({ _id: id, owner: userId });

            if (!deletedItem) {
            return res.status(403).json({ message: "Unauthorized: You cannot delete this item." });
            }

            res.status(204).end();
        } catch (error) {
            console.error("Error in deleteItem:", error);
            res.status(500).json({ message: "Server Error" });
        }
    }
}

export default BaseController;