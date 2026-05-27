export const UPLOAD_CENTER_CATEGORIES = ["assignment", "test", "marks", "scheduling", "meeting"];

export const UPLOAD_CENTER_ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "txt",
  "rtf",
  "csv",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "zip",
  "rar",
  "7z",
  "md",
  "json",
];

export const UPLOAD_CENTER_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/rtf",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.rar",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
  "application/json",
  "text/markdown",
];

export const UPLOAD_CENTER_DEFAULT_MAX_FILE_SIZE_MB = 15;
export const UPLOAD_CENTER_DEFAULT_MAX_FILES = 10;

export const UPLOAD_CENTER_CATEGORY_OPTIONS = {
  assignment: [
    "due_at",
    "starts_at",
    "ends_at",
    "meeting_url",
    "location",
    "is_online",
  ],
  test: [
    "exam_date",
    "starts_at",
    "ends_at",
    "max_marks",
    "meeting_url",
    "location",
    "is_online",
  ],
  marks: [
    "max_marks",
    "obtained_marks",
    "exam_date",
  ],
  scheduling: [
    "starts_at",
    "ends_at",
    "location",
    "reminder_minutes",
    "meeting_url",
    "is_online",
  ],
  meeting: [
    "starts_at",
    "ends_at",
    "meeting_url",
    "location",
    "reminder_minutes",
    "is_online",
  ],
};
