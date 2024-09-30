import express from "express";
import { search } from "../controllers/searchController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, search);

export default router;
