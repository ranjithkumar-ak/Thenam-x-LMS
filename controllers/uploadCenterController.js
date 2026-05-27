import { created, ok } from "../utils/apiResponse.js";
import { AppError } from "../utils/appError.js";
import {
  UPLOAD_CENTER_ALLOWED_EXTENSIONS,
  UPLOAD_CENTER_CATEGORY_OPTIONS,
  UPLOAD_CENTER_CATEGORIES,
  UPLOAD_CENTER_DEFAULT_MAX_FILES,
  UPLOAD_CENTER_DEFAULT_MAX_FILE_SIZE_MB,
} from "../services/uploadCenterConfig.js";
import {
  createUploadCenterItem,
  getUploadCenterAttachmentByFileId,
  getUploadCenterItemById,
  listUploadCenterItems,
  removeUploadCenterAttachment,
  updateUploadCenterItem,
} from "../services/uploadCenterService.js";

function normalizeMultipartBody(body = {}) {
  const payload = { ...body };
  if (typeof payload.options === "string" && payload.options.trim()) {
    try {
      payload.options = JSON.parse(payload.options);
    } catch {
      payload.options = {};
    }
  }
  if (payload.options == null || typeof payload.options !== "object") {
    payload.options = {};
  }
  return payload;
}

function validateUploadPayload(payload, { partial = false } = {}) {
  if (!partial && !payload.category) {
    throw new AppError("category is required.", 400);
  }

  if (!partial && !payload.title) {
    throw new AppError("title is required.", 400);
  }

  if (payload.category && !UPLOAD_CENTER_CATEGORIES.includes(payload.category)) {
    throw new AppError("Invalid category. Use assignment, test, marks, scheduling, or meeting.", 400);
  }

  if (payload.status && !["draft", "published", "archived"].includes(payload.status)) {
    throw new AppError("Invalid status. Use draft, published, or archived.", 400);
  }
}

export async function getUploadModuleOptions(req, res) {
  return ok(
    res,
    {
      categories: UPLOAD_CENTER_CATEGORIES,
      category_options: UPLOAD_CENTER_CATEGORY_OPTIONS,
      accepted_extensions: UPLOAD_CENTER_ALLOWED_EXTENSIONS,
      limits: {
        max_files: UPLOAD_CENTER_DEFAULT_MAX_FILES,
        max_file_size_mb: UPLOAD_CENTER_DEFAULT_MAX_FILE_SIZE_MB,
      },
    },
    undefined,
    "Upload module metadata fetched.",
  );
}

export async function createUploadItem(req, res) {
  const payload = normalizeMultipartBody(req.body);
  validateUploadPayload(payload);
  const record = await createUploadCenterItem(payload, req.files ?? []);
  return created(res, record, undefined, "Upload module item created.");
}

export async function listUploadItems(req, res) {
  const data = await listUploadCenterItems(req.query);
  return ok(res, data.records, data.meta, "Upload module items fetched.");
}

export async function getUploadItem(req, res) {
  const record = await getUploadCenterItemById(req.params.itemId);
  return ok(res, record, undefined, "Upload module item fetched.");
}

export async function updateUploadItem(req, res) {
  const payload = normalizeMultipartBody(req.body);
  validateUploadPayload(payload, { partial: true });
  const record = await updateUploadCenterItem(req.params.itemId, payload, req.files ?? []);
  return ok(res, record, undefined, "Upload module item updated.");
}

export async function deleteUploadAttachment(req, res) {
  const record = await removeUploadCenterAttachment(req.params.itemId, req.params.fileId);
  return ok(res, record, undefined, "Attachment removed.");
}

export async function downloadUploadAttachment(req, res) {
  const { attachment, absolutePath } = await getUploadCenterAttachmentByFileId(req.params.fileId);
  res.setHeader("Content-Type", attachment.mime_type || "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${attachment.original_name}"`);
  return res.sendFile(absolutePath);
}
