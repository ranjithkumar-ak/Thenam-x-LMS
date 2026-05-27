import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { UploadCenterItem } from "../models/UploadCenterItem.js";
import { AppError } from "../utils/appError.js";

const UPLOAD_ROOT = path.join(process.cwd(), "server", "uploads", "upload-center");

function generateItemId() {
  const stamp = Date.now().toString(36);
  return `UP-${stamp}-${randomUUID().slice(0, 6).toUpperCase()}`;
}

function normalizeDate(value) {
  if (value == null || value === "") {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeNumber(value) {
  if (value == null || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["true", "1", "yes", "on"].includes(value.toLowerCase());
  }
  return false;
}

function normalizeOptions(options = {}) {
  return {
    due_at: normalizeDate(options.due_at),
    starts_at: normalizeDate(options.starts_at),
    ends_at: normalizeDate(options.ends_at),
    exam_date: normalizeDate(options.exam_date),
    max_marks: normalizeNumber(options.max_marks),
    obtained_marks: normalizeNumber(options.obtained_marks),
    meeting_url: options.meeting_url?.trim?.() ?? "",
    location: options.location?.trim?.() ?? "",
    reminder_minutes: normalizeNumber(options.reminder_minutes),
    is_online: normalizeBoolean(options.is_online),
  };
}

function mapAttachment(file) {
  const extension = path.extname(file.originalname || "").replace(".", "").toLowerCase();
  const fileId = randomUUID();
  return {
    file_id: fileId,
    original_name: file.originalname,
    stored_name: file.filename,
    mime_type: file.mimetype,
    extension,
    size_bytes: file.size,
    relative_path: path.relative(process.cwd(), file.path).replace(/\\/g, "/"),
    download_url: `/api/upload-center/files/${fileId}/download`,
    uploaded_at: new Date(),
  };
}

async function removeRelativeFile(relativePath) {
  if (!relativePath) return;
  const fullPath = path.resolve(process.cwd(), relativePath);
  if (!fullPath.startsWith(UPLOAD_ROOT)) return;
  try {
    await fs.unlink(fullPath);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
}

function parseSort(sortBy = "newest") {
  if (sortBy === "oldest") return { createdAt: 1 };
  if (sortBy === "updated") return { updatedAt: -1 };
  return { createdAt: -1 };
}

export async function createUploadCenterItem(payload, files = []) {
  const attachments = files.map(mapAttachment);
  const created = await UploadCenterItem.create({
    item_id: generateItemId(),
    category: payload.category,
    title: payload.title,
    description: payload.description ?? "",
    class_id: payload.class_id ?? "",
    subject: payload.subject ?? "",
    student_id: payload.student_id ?? "",
    teacher_id: payload.teacher_id ?? "",
    created_by: payload.created_by ?? "",
    status: payload.status ?? "published",
    options: normalizeOptions(payload.options),
    attachments,
  });

  return created.toObject();
}

export async function listUploadCenterItems({ category, status, class_id, q, sort = "newest", limit = 50, page = 1 }) {
  const filter = {};
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (class_id) filter.class_id = class_id;
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { subject: { $regex: q, $options: "i" } },
    ];
  }

  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 50));
  const skip = (pageNumber - 1) * pageSize;

  const [records, total] = await Promise.all([
    UploadCenterItem.find(filter, { _id: 0 }).sort(parseSort(sort)).skip(skip).limit(pageSize).lean(),
    UploadCenterItem.countDocuments(filter),
  ]);

  return {
    records,
    meta: {
      page: pageNumber,
      limit: pageSize,
      total,
      pages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function getUploadCenterItemById(itemId) {
  const record = await UploadCenterItem.findOne({ item_id: itemId }, { _id: 0 }).lean();
  if (!record) {
    throw new AppError("Upload item not found.", 404);
  }
  return record;
}

export async function updateUploadCenterItem(itemId, payload, files = []) {
  const record = await UploadCenterItem.findOne({ item_id: itemId });
  if (!record) {
    throw new AppError("Upload item not found.", 404);
  }

  const scalarFields = ["title", "description", "class_id", "subject", "student_id", "teacher_id", "created_by", "status"];
  for (const field of scalarFields) {
    if (payload[field] !== undefined) {
      record[field] = payload[field];
    }
  }

  if (payload.category !== undefined) {
    record.category = payload.category;
  }

  if (payload.options !== undefined) {
    record.options = normalizeOptions(payload.options);
  }

  if (files.length) {
    record.attachments.push(...files.map(mapAttachment));
  }

  await record.save();
  return record.toObject();
}

export async function removeUploadCenterAttachment(itemId, fileId) {
  const record = await UploadCenterItem.findOne({ item_id: itemId });
  if (!record) {
    throw new AppError("Upload item not found.", 404);
  }

  const target = record.attachments.find((attachment) => attachment.file_id === fileId);
  if (!target) {
    throw new AppError("Attachment not found.", 404);
  }

  record.attachments = record.attachments.filter((attachment) => attachment.file_id !== fileId);
  await record.save();
  await removeRelativeFile(target.relative_path);

  return record.toObject();
}

export async function getUploadCenterAttachmentByFileId(fileId) {
  const record = await UploadCenterItem.findOne(
    { "attachments.file_id": fileId },
    {
      _id: 0,
      item_id: 1,
      title: 1,
      category: 1,
      attachments: { $elemMatch: { file_id: fileId } },
    },
  ).lean();

  if (!record?.attachments?.length) {
    throw new AppError("Attachment not found.", 404);
  }

  const attachment = record.attachments[0];
  const absolutePath = path.resolve(process.cwd(), attachment.relative_path);
  if (!absolutePath.startsWith(UPLOAD_ROOT)) {
    throw new AppError("Attachment path is invalid.", 400);
  }

  try {
    await fs.access(absolutePath);
  } catch {
    throw new AppError("Attachment file is missing on disk.", 404);
  }

  return {
    record,
    attachment,
    absolutePath,
  };
}
