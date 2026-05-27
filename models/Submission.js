import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    assignment_id: { type: String, required: true, index: true },
    student_id: { type: String, required: true, index: true },
    marks: { type: Number, default: null },
    notes: { type: String, default: "" },
    attachment_name: { type: String, default: "" },
    attachment_url: { type: String, default: "" },
    submitted_at: { type: Date, default: Date.now },
    graded_at: { type: Date, default: null },
  },
  {
    collection: "submissions",
    timestamps: true,
  },
);

submissionSchema.index({ assignment_id: 1, student_id: 1 }, { unique: true });

export const Submission = mongoose.model("Submission", submissionSchema);
