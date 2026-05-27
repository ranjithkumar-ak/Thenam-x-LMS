import express from "express";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { getParentOverview } from "../controllers/parentController.js";

const router = express.Router();

router.get("/:parentId/overview", asyncHandler(getParentOverview));

export default router;