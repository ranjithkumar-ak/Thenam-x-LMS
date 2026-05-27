import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    detail: { type: String, required: true },
    tone: { type: String, enum: ["brand", "success", "warning", "neutral"], default: "brand" },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const profileSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      enum: ["admin", "teacher", "student", "parent", "accounts"],
      index: true,
    },
    display_name: { type: String, required: true },
    subtitle: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    bio: { type: String, default: "" },
    avatar_url: { type: String, default: "" },
    theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
    accent: { type: String, enum: ["brand", "emerald", "amber", "rose"], default: "brand" },
    density: { type: String, enum: ["comfortable", "compact"], default: "comfortable" },
    default_landing: { type: String, default: "/admin" },
    compact_sidebar: { type: Boolean, default: false },
    keyboard_shortcuts: { type: Boolean, default: true },
    email_notifications: { type: Boolean, default: true },
    sms_notifications: { type: Boolean, default: false },
    weekly_digest: { type: Boolean, default: true },
    recent_activity: { type: [activitySchema], default: [] },
  },
  {
    collection: "profiles",
    timestamps: true,
  },
);

profileSchema.index({ role: 1, display_name: 1 });

export const Profile = mongoose.model("Profile", profileSchema);
