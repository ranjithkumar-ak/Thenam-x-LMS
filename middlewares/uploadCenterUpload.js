import fs from "node:fs";
import path from "node:path";
import multer from "multer";

import { AppError } from "../utils/appError.js";
import {
  UPLOAD_CENTER_ALLOWED_EXTENSIONS,
  UPLOAD_CENTER_ALLOWED_MIME_TYPES,
  UPLOAD_CENTER_DEFAULT_MAX_FILE_SIZE_MB,
  UPLOAD_CENTER_DEFAULT_MAX_FILES,
} from "../services/uploadCenterConfig.js";

const UPLOAD_DIR = path.join(process.cwd(), "server", "uploads", "upload-center");

const ALLOWED_EXTENSIONS = new Set(UPLOAD_CENTER_ALLOWED_EXTENSIONS);
const ALLOWED_MIME_TYPES = new Set(UPLOAD_CENTER_ALLOWED_MIME_TYPES);

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function buildStoredName(file) {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const safeBase = path
    .basename(file.originalname || "file", ext)
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .slice(0, 48);
  return `${Date.now()}-${safeBase || "upload"}${ext}`;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, buildStoredName(file));
  },
});

function fileFilter(req, file, cb) {
  const extension = path.extname(file.originalname || "").replace(".", "").toLowerCase();
  const mimeAllowed = ALLOWED_MIME_TYPES.has(file.mimetype);
  const extAllowed = ALLOWED_EXTENSIONS.has(extension);

  if (!mimeAllowed && !extAllowed) {
    return cb(new AppError(`Unsupported file format for ${file.originalname}.`, 400));
  }

  return cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: UPLOAD_CENTER_DEFAULT_MAX_FILE_SIZE_MB * 1024 * 1024,
    files: UPLOAD_CENTER_DEFAULT_MAX_FILES,
  },
});

export const uploadCenterAttachments = upload.array("attachments", UPLOAD_CENTER_DEFAULT_MAX_FILES);

export function handleUploadCenterMulter(req, res, next) {
  uploadCenterAttachments(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return next(new AppError(`Each file must be ${UPLOAD_CENTER_DEFAULT_MAX_FILE_SIZE_MB}MB or smaller.`, 400));
      }
      if (error.code === "LIMIT_FILE_COUNT") {
        return next(new AppError(`At most ${UPLOAD_CENTER_DEFAULT_MAX_FILES} files are allowed per request.`, 400));
      }
      return next(new AppError(error.message, 400));
    }

    return next(error);
  });
}
