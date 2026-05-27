import express from "express";

import { asyncHandler } from "../middlewares/asyncHandler.js";
import { handleUploadCenterMulter } from "../middlewares/uploadCenterUpload.js";
import { validateRequest } from "../middlewares/validate.js";
import {
  createUploadItem,
  deleteUploadAttachment,
  downloadUploadAttachment,
  getUploadModuleOptions,
  getUploadItem,
  listUploadItems,
  updateUploadItem,
} from "../controllers/uploadCenterController.js";
import {
  uploadCenterAttachmentParamsSchema,
  uploadCenterFileParamsSchema,
  uploadCenterItemParamsSchema,
  uploadCenterQuerySchema,
} from "../validators/apiSchemas.js";

const router = express.Router();

router.get("/options", asyncHandler(getUploadModuleOptions));
router.get("/", validateRequest({ query: uploadCenterQuerySchema }), asyncHandler(listUploadItems));
router.post("/", handleUploadCenterMulter, asyncHandler(createUploadItem));
router.get("/:itemId", validateRequest({ params: uploadCenterItemParamsSchema }), asyncHandler(getUploadItem));
router.patch("/:itemId", validateRequest({ params: uploadCenterItemParamsSchema }), handleUploadCenterMulter, asyncHandler(updateUploadItem));
router.delete(
  "/:itemId/attachments/:fileId",
  validateRequest({ params: uploadCenterAttachmentParamsSchema }),
  asyncHandler(deleteUploadAttachment),
);
router.get(
  "/files/:fileId/download",
  validateRequest({ params: uploadCenterFileParamsSchema }),
  asyncHandler(downloadUploadAttachment),
);

export default router;
