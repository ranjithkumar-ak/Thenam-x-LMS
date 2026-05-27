import { z } from "zod";

const idString = z.string().trim().min(1, "This field is required.");

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  q: z.string().trim().min(1).optional(),
  class_id: z.string().trim().min(1).optional(),
});

export const studentIdParamsSchema = z.object({
  id: idString.optional(),
  studentId: idString.optional(),
});

export const classIdParamsSchema = z.object({
  classId: idString,
});

export const studentAnalyticsParamsSchema = z.object({
  studentId: idString,
});

export const teacherAnalyticsParamsSchema = z.object({
  teacherId: idString,
});

export const studentCreateSchema = z.object({
  student_id: idString,
  class_id: idString,
  name: z.string().trim().min(2, "Student name must be at least 2 characters."),
});

export const attendanceCreateSchema = z.object({
  student_id: idString,
  class_id: idString,
  date: z.union([z.string().trim().min(1), z.date()]),
  status: z.enum(["present", "absent", "late", "excused"]),
});

export const assignmentCreateSchema = z.object({
  class_id: idString,
  subject: z.string().trim().min(1),
  title: z.string().trim().min(1),
  assignment_id: z.string().trim().min(1).optional(),
});

export const submissionAssignmentParamsSchema = z.object({
  assignmentId: idString,
});

export const submissionAssignmentStudentParamsSchema = z.object({
  assignmentId: idString,
  studentId: idString,
});

export const submissionUpsertSchema = z.object({
  student_id: idString,
  marks: z.coerce.number().nonnegative().nullable().optional(),
  notes: z.string().trim().min(1).optional(),
  attachment_name: z.string().trim().min(1).optional(),
  attachment_url: z.string().trim().min(1).optional(),
});

export const marksCreateSchema = z.object({
  student_id: idString,
  subject: z.string().trim().min(1),
  exam: z.string().trim().min(1),
  marks: z.coerce.number().nonnegative(),
  max_marks: z.coerce.number().positive(),
});

export const paymentCreateSchema = z.object({
  student_id: idString,
  amount: z.coerce.number().positive(),
  method: z.string().trim().min(1),
  date: z.union([z.string().trim().min(1), z.date()]),
  transaction_id: z.string().trim().min(1).optional(),
});

export const timetableCreateSchema = z.object({
  day: z.string().trim().min(1),
  period: z.coerce.number().int().positive(),
  start_time: z.string().trim().min(1),
  end_time: z.string().trim().min(1),
  class_id: idString,
  subject: z.string().trim().min(1),
  teacher_id: idString,
  teacher_name: z.string().trim().min(1),
  room: z.string().trim().min(1),
  grade: z.coerce.number().int().positive().nullable().optional(),
  section: z.string().trim().min(1).nullable().optional(),
  timetable_id: z.string().trim().min(1).optional(),
  status: z.string().trim().min(1).optional(),
});

export const aiChatSchema = z.object({
  student_id: idString,
  subject: z.string().trim().min(1),
  question: z.string().trim().min(1),
});

export const profileRoleParamsSchema = z.object({
  role: z.enum(["admin", "teacher", "student", "parent", "accounts"]),
});

export const profileUpdateSchema = z.object({
  display_name: z.string().trim().min(2).optional(),
  subtitle: z.string().trim().min(2).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(3).optional(),
  location: z.string().trim().min(2).optional(),
  bio: z.string().trim().min(10).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  accent: z.enum(["brand", "emerald", "amber", "rose"]).optional(),
  density: z.enum(["comfortable", "compact"]).optional(),
  default_landing: z.string().trim().min(1).optional(),
  compact_sidebar: z.coerce.boolean().optional(),
  keyboard_shortcuts: z.coerce.boolean().optional(),
  email_notifications: z.coerce.boolean().optional(),
  sms_notifications: z.coerce.boolean().optional(),
  weekly_digest: z.coerce.boolean().optional(),
});

export const uploadCenterQuerySchema = z.object({
  category: z.enum(["assignment", "test", "marks", "scheduling", "meeting"]).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  class_id: z.string().trim().min(1).optional(),
  q: z.string().trim().min(1).optional(),
  sort: z.enum(["newest", "oldest", "updated"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const uploadCenterItemParamsSchema = z.object({
  itemId: idString,
});

export const uploadCenterAttachmentParamsSchema = z.object({
  itemId: idString,
  fileId: idString,
});

export const uploadCenterFileParamsSchema = z.object({
  fileId: idString,
});
