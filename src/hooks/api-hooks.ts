import { useMutation, useQuery, useQueryClient, useQueries } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost } from "../lib/api-client";
import type { Role } from "@/components/app/role-context";

export type Student = { student_id: string; class_id: string; name: string };
export type Teacher = { teacher_id: string; name: string; subject: string };
export type Attendance = { student_id: string; class_id: string; date: string; status: string };
export type Marks = { student_id: string; subject: string; exam: string; marks: number; max_marks: number };
export type Assignment = { assignment_id: string; class_id: string; subject: string; title: string };
export type AssignmentInput = { class_id: string; subject: string; title: string };
export type AssignmentWithStats = Assignment & {
  submissions_count?: number;
  average_marks?: number | null;
  due_date?: string;
};
export type StudentAssignment = Assignment & {
  due_date: string;
  status: "pending" | "submitted" | "graded";
  submission_marks: number | null;
  submission_notes?: string;
  attachment_name?: string;
  attachment_url?: string;
  submitted_at?: string | null;
  graded_at?: string | null;
};
export type SubmissionRecord = {
  assignment_id: string;
  student_id: string;
  marks: number | null;
  notes: string;
  attachment_name: string;
  attachment_url: string;
  submitted_at: string | null;
  graded_at: string | null;
};
export type SubmissionInput = {
  student_id: string;
  marks?: number | null;
  notes?: string;
  attachment_name?: string;
  attachment_url?: string;
};
export type Fees = { student_id: string; total_fee: number; paid: number; balance: number };
export type Payment = { student_id: string; amount: number; method: string; date: string; transaction_id?: string };
export type PaymentRecord = { student_id: string; amount: number; method: string; date: string; transaction_id?: string };
export type AttendanceSummary = {
  student_id: string;
  overall: { attended_sessions: number; total_sessions: number; attendance_percent: number };
  subjects: {
    subject: string;
    attended_sessions: number;
    total_sessions: number;
    attendance_percent: number;
  }[];
};
export type TimetableEntry = {
  timetable_id: string;
  day: string;
  period: number;
  start_time: string;
  end_time: string;
  class_id: string;
  grade: number | null;
  section: string | null;
  subject: string;
  teacher_id: string;
  teacher_name: string;
  room: string;
  status: string;
};
export type NotificationItem = {
  notification_id: string;
  type: string;
  title: string;
  message: string;
  severity: "danger" | "warning" | "success" | "brand";
  date: string;
  read: boolean;
};
export type ClassAnalytics = {
  class_id: string;
  student_count: number;
  attendance_rate: number;
  average_score: number;
  assignments_count: number;
  teacher_assignments: number;
  subject_scores: { subject: string; averageScore: number; entries: number }[];
};

export type ProfileActivity = {
  title: string;
  detail: string;
  tone: "brand" | "success" | "warning" | "neutral";
  at: string;
};

export type ProfileRecord = {
  role: Role;
  display_name: string;
  subtitle: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  theme: "light" | "dark" | "system";
  accent: "brand" | "emerald" | "amber" | "rose";
  density: "comfortable" | "compact";
  default_landing: string;
  compact_sidebar: boolean;
  keyboard_shortcuts: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  weekly_digest: boolean;
  recent_activity: ProfileActivity[];
};

export type ProfileUpdateInput = Partial<Omit<ProfileRecord, "role" | "recent_activity">>;

export type ParentOverview = {
  parent: { parent_id: string; student_id: string; name: string };
  student: Student | null;
  attendanceSummary: AttendanceSummary | null;
  assignments: StudentAssignment[];
  notifications: NotificationItem[];
};

export type UploadCenterCategory = "assignment" | "test" | "marks" | "scheduling" | "meeting";
export type UploadCenterStatus = "draft" | "published" | "archived";

export type UploadCenterAttachment = {
  file_id: string;
  original_name: string;
  stored_name: string;
  mime_type: string;
  extension: string;
  size_bytes: number;
  relative_path: string;
  download_url: string;
  uploaded_at: string;
};

export type UploadCenterOptions = {
  due_at?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  exam_date?: string | null;
  max_marks?: number | null;
  obtained_marks?: number | null;
  meeting_url?: string;
  location?: string;
  reminder_minutes?: number | null;
  is_online?: boolean;
};

export type UploadCenterItem = {
  item_id: string;
  category: UploadCenterCategory;
  title: string;
  description: string;
  class_id: string;
  subject: string;
  student_id: string;
  teacher_id: string;
  created_by: string;
  status: UploadCenterStatus;
  options: UploadCenterOptions;
  attachments: UploadCenterAttachment[];
  createdAt: string;
  updatedAt: string;
};

export type UploadCenterListMeta = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type UploadCenterModuleOptions = {
  categories: UploadCenterCategory[];
  category_options: Record<UploadCenterCategory, string[]>;
  accepted_extensions: string[];
  limits: { max_files: number; max_file_size_mb: number };
};

export type UploadCenterFilters = {
  category?: UploadCenterCategory;
  status?: UploadCenterStatus;
  class_id?: string;
  q?: string;
  sort?: "newest" | "oldest" | "updated";
  page?: number;
  limit?: number;
};

type ApiList<T> = { data: T[] };
type ApiItem<T> = { data: T };
type ApiEnvelope<T> = { data: T };
type ApiListWithMeta<T, M = unknown> = { data: T[]; meta: M };

type AIPayload = { student_id: string; subject: string; question: string };
type AIResponse = { answer: string; sources?: { id: string; title: string }[] };

export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: () => apiGet<ApiList<Student>>("/students"),
    select: (data) => data.data,
  });
}

export function useStudent(id: string | undefined) {
  return useQuery({
    queryKey: ["students", id],
    queryFn: () => apiGet<ApiItem<Student>>(`/students/${id}`),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useStudentsByClass(classId: string | undefined) {
  return useQuery({
    queryKey: ["students", "class", classId],
    queryFn: () => apiGet<ApiList<Student>>(`/students/class/${classId}`),
    select: (data) => data.data,
    enabled: !!classId,
  });
}

export function useTeachers() {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: () => apiGet<ApiList<Teacher>>("/teachers"),
    select: (data) => data.data,
  });
}

export function useAttendance(studentId: string | undefined) {
  return useQuery({
    queryKey: ["attendance", studentId],
    queryFn: () => apiGet<ApiList<Attendance>>(`/attendance/${studentId}`),
    select: (data) => data.data,
    enabled: !!studentId,
  });
}

export function useClassAttendance(classId: string | undefined) {
  return useQuery({
    queryKey: ["attendance", "class", classId],
    queryFn: () => apiGet<ApiList<Attendance>>(`/attendance/class/${classId}`),
    select: (data) => data.data,
    enabled: !!classId,
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Attendance) => apiPost<ApiItem<Attendance>>("/attendance", payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useAttendanceSummary(studentId: string | undefined) {
  return useQuery({
    queryKey: ["attendance", "summary", studentId],
    queryFn: () => apiGet<ApiItem<AttendanceSummary>>(`/attendance/student/${studentId}/summary`),
    select: (data) => data.data,
    enabled: !!studentId,
  });
}

export function useMarks(studentId: string | undefined) {
  return useQuery({
    queryKey: ["marks", studentId],
    queryFn: () => apiGet<ApiList<Marks>>(`/marks/${studentId}`),
    select: (data) => data.data,
    enabled: !!studentId,
  });
}

export function useCreateMarks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Marks) => apiPost<ApiItem<Marks>>("/marks", payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["marks"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useAssignments(classId: string | undefined) {
  return useQuery({
    queryKey: ["assignments", classId],
    queryFn: () => apiGet<ApiList<AssignmentWithStats>>(`/assignments/${classId}`),
    select: (data) => data.data,
    enabled: !!classId,
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignmentInput) => apiPost<ApiItem<Assignment>>("/assignments", payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useStudentAssignments(studentId: string | undefined) {
  return useQuery({
    queryKey: ["assignments", "student", studentId],
    queryFn: () => apiGet<ApiList<StudentAssignment>>(`/assignments/student/${studentId}`),
    select: (data) => data.data,
    enabled: !!studentId,
  });
}

export function useSubmission(assignmentId: string | undefined, studentId: string | undefined) {
  return useQuery({
    queryKey: ["submissions", assignmentId, studentId],
    queryFn: () => apiGet<ApiItem<SubmissionRecord>>(`/assignments/${assignmentId}/submissions/${studentId}`),
    select: (data) => data.data,
    enabled: !!assignmentId && !!studentId,
  });
}

export function useSaveSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assignmentId, payload }: { assignmentId: string; payload: SubmissionInput }) =>
      apiPost<ApiItem<SubmissionRecord>>(`/assignments/${assignmentId}/submissions`, payload),
    onSuccess: (response, variables) => {
      const submission = response.data;
      queryClient.setQueryData(["submissions", submission.assignment_id, submission.student_id], submission);
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["submissions", variables.assignmentId, variables.payload.student_id] });
    },
  });
}

export function useFees(studentId: string | undefined) {
  return useQuery({
    queryKey: ["fees", studentId],
    queryFn: () => apiGet<ApiItem<Fees>>(`/fees/${studentId}`),
    select: (data) => data.data,
    enabled: !!studentId,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Payment) => apiPost<ApiItem<Payment>>("/payments", payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function usePayments() {
  return useQuery({
    queryKey: ["payments"],
    queryFn: () => apiGet<ApiList<PaymentRecord>>("/payments"),
    select: (data) => data.data,
  });
}

export function useTimetable() {
  return useQuery({
    queryKey: ["timetable"],
    queryFn: () => apiGet<ApiList<TimetableEntry>>("/timetable"),
    select: (data) => data.data,
  });
}

export function useCreateTimetable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TimetableEntry) => apiPost<ApiItem<TimetableEntry>>("/timetable", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
    },
  });
}

export function useNotifications(studentId: string | undefined) {
  return useQuery({
    queryKey: ["notifications", studentId],
    queryFn: () => apiGet<ApiList<NotificationItem>>(`/notifications/${studentId}`),
    select: (data) => data.data,
    enabled: !!studentId,
  });
}

export function useClassAnalytics(classId: string | undefined) {
  return useQuery({
    queryKey: ["analytics", classId],
    queryFn: () => apiGet<ApiItem<ClassAnalytics>>(`/analytics/class/${classId}`),
    select: (data) => data.data,
    enabled: !!classId,
  });
}

export function useClassAnalyticsQueries(classIds: string[]) {
  return useQueries({
    queries: classIds.map((classId) => ({
      queryKey: ["analytics", classId],
      queryFn: () => apiGet<ApiItem<ClassAnalytics>>(`/analytics/class/${classId}`),
      select: (data: ApiItem<ClassAnalytics>) => data.data,
      enabled: !!classId,
    })),
  });
}

export function useTimetableByTeacher(teacherId: string | undefined) {
  return useQuery({
    queryKey: ["timetable", "teacher", teacherId],
    queryFn: () => apiGet<ApiList<TimetableEntry>>(`/timetable/teacher/${teacherId}`),
    select: (data) => data.data,
    enabled: !!teacherId,
  });
}

export function useParentOverview(parentId: string | undefined) {
  return useQuery({
    queryKey: ["parents", parentId, "overview"],
    queryFn: () => apiGet<ApiItem<ParentOverview>>(`/parents/${parentId}/overview`),
    select: (data) => data.data,
    enabled: !!parentId,
  });
}

export function useAIChat() {
  return useMutation({
    mutationFn: async (payload: AIPayload) => {
      const response = await apiPost<ApiEnvelope<AIResponse>>("/ai/chat", payload);
      return response.data;
    },
  });
}

export function useProfile(role: Role | undefined) {
  return useQuery({
    queryKey: ["profile", role],
    queryFn: () => apiGet<ApiItem<ProfileRecord>>(`/profile/${role}`),
    select: (data) => data.data,
    enabled: !!role,
  });
}

export function useProfileActivity(role: Role | undefined) {
  return useQuery({
    queryKey: ["profile", role, "activity"],
    queryFn: () => apiGet<ApiList<ProfileActivity>>(`/profile/${role}/activity`),
    select: (data) => data.data,
    enabled: !!role,
  });
}

export function useUpdateProfile(role: Role | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProfileUpdateInput) => {
      if (!role) throw new Error("Profile role is required.");
      return apiPatch<ApiItem<ProfileRecord>>(`/profile/${role}`, payload);
    },
    onSuccess: (response) => {
      const profile = response.data;
      queryClient.setQueryData(["profile", profile.role], profile);
      queryClient.invalidateQueries({ queryKey: ["profile", profile.role, "activity"] });
    },
  });
}

export function useFeesQueries(studentIds: string[]) {
  return useQueries({
    queries: studentIds.map((studentId) => ({
      queryKey: ["fees", studentId],
      queryFn: () => apiGet<ApiItem<Fees>>(`/fees/${studentId}`),
      select: (data: ApiItem<Fees>) => data.data,
      enabled: !!studentId,
    })),
  });
}

function buildUploadCenterQuery(filters: UploadCenterFilters = {}) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const stringified = query.toString();
  return stringified ? `?${stringified}` : "";
}

function buildUploadCenterFormData(input: {
  category?: UploadCenterCategory;
  title?: string;
  description?: string;
  class_id?: string;
  subject?: string;
  student_id?: string;
  teacher_id?: string;
  created_by?: string;
  status?: UploadCenterStatus;
  options?: UploadCenterOptions;
  files?: File[];
}) {
  const formData = new FormData();
  const scalarKeys: Array<keyof typeof input> = [
    "category",
    "title",
    "description",
    "class_id",
    "subject",
    "student_id",
    "teacher_id",
    "created_by",
    "status",
  ];

  scalarKeys.forEach((key) => {
    const value = input[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      formData.append(key, String(value));
    }
  });

  if (input.options) {
    formData.append("options", JSON.stringify(input.options));
  }

  (input.files ?? []).forEach((file) => {
    formData.append("attachments", file);
  });

  return formData;
}

export function useUploadCenterOptions() {
  return useQuery({
    queryKey: ["upload-center", "options"],
    queryFn: () => apiGet<ApiItem<UploadCenterModuleOptions>>("/upload-center/options"),
    select: (data) => data.data,
  });
}

export function useUploadCenterItems(filters: UploadCenterFilters = {}) {
  const query = buildUploadCenterQuery(filters);
  return useQuery({
    queryKey: ["upload-center", "items", filters],
    queryFn: () => apiGet<ApiListWithMeta<UploadCenterItem, UploadCenterListMeta>>(`/upload-center${query}`),
    select: (data) => ({ records: data.data, meta: data.meta }),
  });
}

export function useUploadCenterItem(itemId: string | undefined) {
  return useQuery({
    queryKey: ["upload-center", "item", itemId],
    queryFn: () => apiGet<ApiItem<UploadCenterItem>>(`/upload-center/${itemId}`),
    select: (data) => data.data,
    enabled: !!itemId,
  });
}

export function useCreateUploadCenterItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      category: UploadCenterCategory;
      title: string;
      description?: string;
      class_id?: string;
      subject?: string;
      student_id?: string;
      teacher_id?: string;
      created_by?: string;
      status?: UploadCenterStatus;
      options?: UploadCenterOptions;
      files?: File[];
    }) => {
      const body = buildUploadCenterFormData(input);
      return apiPost<ApiItem<UploadCenterItem>>("/upload-center", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upload-center", "items"] });
    },
  });
}

export function useUpdateUploadCenterItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      input,
    }: {
      itemId: string;
      input: {
        category?: UploadCenterCategory;
        title?: string;
        description?: string;
        class_id?: string;
        subject?: string;
        student_id?: string;
        teacher_id?: string;
        created_by?: string;
        status?: UploadCenterStatus;
        options?: UploadCenterOptions;
        files?: File[];
      };
    }) => {
      const body = buildUploadCenterFormData(input);
      return apiRequest<ApiItem<UploadCenterItem>>(`/upload-center/${itemId}`, { method: "PATCH", body });
    },
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["upload-center", "items"] });
      queryClient.invalidateQueries({ queryKey: ["upload-center", "item", variables.itemId] });
    },
  });
}

export function useDeleteUploadCenterAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, fileId }: { itemId: string; fileId: string }) =>
      apiRequest<ApiItem<UploadCenterItem>>(`/upload-center/${itemId}/attachments/${fileId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upload-center", "items"] });
      queryClient.invalidateQueries({ queryKey: ["upload-center", "item"] });
    },
  });
}
