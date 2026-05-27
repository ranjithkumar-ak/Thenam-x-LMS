import { Parent } from "../models/Parent.js";
import { Student } from "../models/Student.js";
import { getStudentAttendanceSummary } from "./attendanceService.js";
import { getAssignmentsForStudent } from "./assignmentService.js";
import { listNotificationsForStudent } from "./notificationService.js";

export async function getParentOverview(parentId) {
  const parent = await Parent.findOne({ parent_id: parentId }, { _id: 0 }).lean();
  if (!parent) return null;

  const student = await Student.findOne({ student_id: parent.student_id }, { _id: 0 }).lean();
  if (!student) {
    return {
      parent,
      student: null,
      attendanceSummary: null,
      assignments: [],
      notifications: [],
    };
  }

  const [attendanceSummary, assignments, notifications] = await Promise.all([
    getStudentAttendanceSummary(student.student_id),
    getAssignmentsForStudent(student.student_id),
    listNotificationsForStudent(student.student_id),
  ]);

  return {
    parent,
    student,
    attendanceSummary,
    assignments: assignments ?? [],
    notifications,
  };
}