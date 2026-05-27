import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    file_id: { type: String, required: true },
    original_name: { type: String, required: true },
    stored_name: { type: String, required: true },
    mime_type: { type: String, required: true },
    extension: { type: String, required: true },
    size_bytes: { type: Number, required: true },
    relative_path: { type: String, required: true },
    download_url: { type: String, required: true },
    uploaded_at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const uploadCenterItemSchema = new mongoose.Schema(
  {
    item_id: { type: String, required: true, unique: true, index: true },
    category: {
      type: String,
      required: true,
      enum: ["assignment", "test", "marks", "scheduling", "meeting"],
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    class_id: { type: String, default: "", trim: true },
    subject: { type: String, default: "", trim: true },
    student_id: { type: String, default: "", trim: true },
    teacher_id: { type: String, default: "", trim: true },
    created_by: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
      index: true,
    },
    options: {
      due_at: { type: Date, default: null },
      starts_at: { type: Date, default: null },
      ends_at: { type: Date, default: null },
      exam_date: { type: Date, default: null },
      max_marks: { type: Number, default: null },
      obtained_marks: { type: Number, default: null },
      meeting_url: { type: String, default: "", trim: true },
      location: { type: String, default: "", trim: true },
      reminder_minutes: { type: Number, default: null },
      is_online: { type: Boolean, default: false },
    },
    attachments: { type: [attachmentSchema], default: [] },
  },
  {
    collection: "upload_center_items",
    timestamps: true,
  },
);

uploadCenterItemSchema.index({ category: 1, class_id: 1, status: 1 });
uploadCenterItemSchema.index({ title: "text", description: "text", subject: "text" });
uploadCenterItemSchema.index({ "attachments.file_id": 1 });

export const UploadCenterItem = mongoose.model("UploadCenterItem", uploadCenterItemSchema);
