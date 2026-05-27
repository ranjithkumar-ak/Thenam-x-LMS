import { AppError } from "../utils/appError.js";
import { created, ok } from "../utils/apiResponse.js";
import { requireFields } from "../utils/validators.js";
import {
  createAssignment as createAssignmentService,
  getAssignmentsByClass as getAssignmentsByClassService,
  getAssignmentsForStudent,
  getSubmissionForAssignment,
  upsertSubmission,
} from "../services/assignmentService.js";

export async function getAssignmentsByClass(req, res) {
  const records = await getAssignmentsByClassService(req.params.classId);
  return ok(res, records);
}

export async function getAssignmentsByStudent(req, res) {
  const records = await getAssignmentsForStudent(req.params.studentId);
  if (!records) {
    throw new AppError("Student not found.", 404);
  }
  return ok(res, records);
}

export async function createAssignment(req, res) {
  requireFields(req.body, ["class_id", "subject", "title"], "assignment");
  const record = await createAssignmentService(req.body);
  return created(res, { ...record, _id: undefined });
}

export async function getSubmission(req, res) {
  const submission = await getSubmissionForAssignment(req.params.assignmentId, req.params.studentId);
  if (!submission) {
    throw new AppError("Submission not found.", 404);
  }
  return ok(res, submission);
}

export async function saveSubmission(req, res) {
  const submission = await upsertSubmission({
    assignment_id: req.params.assignmentId,
    student_id: req.body.student_id ?? req.params.studentId,
    ...req.body,
  });
  return created(res, { ...submission, _id: undefined });
}
