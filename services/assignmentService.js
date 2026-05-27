import { Assignment } from "../models/Assignment.js";
import { Parent } from "../models/Parent.js";
import { Student } from "../models/Student.js";
import { Submission } from "../models/Submission.js";
import { Mapping } from "../models/Mapping.js";
import { publishDomainEvent } from "../server/events/domainEvents.js";

function generateAssignmentId() {
  const stamp = Date.now().toString().slice(-6);
  return `A${stamp}`;
}

function withSyntheticDueDate(assignment, index = 0) {
  const due = new Date();
  due.setDate(due.getDate() + (index % 10) + 1);
  return {
    ...assignment,
    due_date: due.toISOString(),
  };
}

export async function getAssignmentsByClass(classId) {
  const [assignments, submissions] = await Promise.all([
    Assignment.find({ class_id: classId }, { _id: 0 }).lean(),
    Submission.aggregate([
      { $lookup: { from: "assignments", localField: "assignment_id", foreignField: "assignment_id", as: "assignment" } },
      { $unwind: "$assignment" },
      { $match: { "assignment.class_id": classId } },
      { $group: { _id: "$assignment_id", submissions_count: { $sum: 1 }, average_marks: { $avg: "$marks" } } },
    ]),
  ]);

  const submissionMap = new Map(submissions.map((item) => [item._id, item]));
  return assignments.map((assignment, index) => {
    const merged = submissionMap.get(assignment.assignment_id);
    return {
      ...withSyntheticDueDate(assignment, index),
      submissions_count: merged?.submissions_count ?? 0,
      average_marks: merged?.average_marks ? Math.round(merged.average_marks) : null,
    };
  });
}

export async function createAssignment(payload) {
  const assignment = await Assignment.create({
    assignment_id: payload.assignment_id || generateAssignmentId(),
    class_id: payload.class_id,
    subject: payload.subject,
    title: payload.title,
  });

  const createdAssignment = assignment.toObject();

  const [teacherMapping, students] = await Promise.all([
    Mapping.findOne({ class_id: createdAssignment.class_id }, { _id: 0 }).lean(),
    Student.find({ class_id: createdAssignment.class_id }, { _id: 0 }).lean(),
  ]);

  const parents = students.length
    ? await Parent.find({ student_id: { $in: students.map((student) => student.student_id) } }, { _id: 0 }).lean()
    : [];

  const rooms = [
    "role:admin",
    `class:${createdAssignment.class_id}`,
    teacherMapping?.teacher_id ? `teacher:${teacherMapping.teacher_id}` : null,
    ...students.map((student) => `student:${student.student_id}`),
    ...parents.map((parent) => `parent:${parent.parent_id}`),
  ].filter(Boolean);

  publishDomainEvent("assignment.created", {
    resource: "assignments",
    action: "created",
    class_id: createdAssignment.class_id,
    rooms,
    assignment: createdAssignment,
  });

  return createdAssignment;
}

export async function getAssignmentsForStudent(studentId) {
  const student = await Student.findOne({ student_id: studentId }, { _id: 0 }).lean();
  if (!student) return null;

  const [assignments, submissions] = await Promise.all([
    Assignment.find({ class_id: student.class_id }, { _id: 0 }).lean(),
    Submission.find({ student_id: studentId }, { _id: 0 }).lean(),
  ]);

  const submissionMap = new Map(submissions.map((submission) => [submission.assignment_id, submission]));

  return assignments.map((assignment, index) => {
    const submission = submissionMap.get(assignment.assignment_id);
    return {
      ...withSyntheticDueDate(assignment, index),
      status: submission ? (submission.marks == null ? "submitted" : "graded") : "pending",
      submission_marks: submission?.marks ?? null,
      submission_notes: submission?.notes ?? "",
      attachment_name: submission?.attachment_name ?? "",
      attachment_url: submission?.attachment_url ?? "",
      submitted_at: submission?.submitted_at ?? null,
      graded_at: submission?.graded_at ?? null,
    };
  });
}

export async function getSubmissionForAssignment(assignmentId, studentId) {
  return Submission.findOne({ assignment_id: assignmentId, student_id: studentId }, { _id: 0 }).lean();
}

export async function upsertSubmission({ assignment_id, student_id, marks, notes, attachment_name, attachment_url }) {
  const update = {
    assignment_id,
    student_id,
    submitted_at: new Date(),
    ...(notes !== undefined ? { notes } : {}),
    ...(attachment_name !== undefined ? { attachment_name } : {}),
    ...(attachment_url !== undefined ? { attachment_url } : {}),
    ...(marks === undefined ? {} : { marks, graded_at: marks === null ? null : new Date() }),
  };

  const submission = await Submission.findOneAndUpdate(
    { assignment_id, student_id },
    { $set: update, $setOnInsert: { marks: null, notes: "", attachment_name: "", attachment_url: "", graded_at: null } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  const [student, assignment, teacherMapping, parent] = await Promise.all([
    Student.findOne({ student_id }, { class_id: 1, _id: 0 }).lean(),
    Assignment.findOne({ assignment_id }, { class_id: 1, subject: 1, title: 1, _id: 0 }).lean(),
    Assignment.findOne({ assignment_id }, { class_id: 1 }).lean().then(async (record) => {
      if (!record?.class_id) return null;
      return Mapping.findOne({ class_id: record.class_id }, { _id: 0 }).lean();
    }),
    Parent.findOne({ student_id }, { _id: 0 }).lean(),
  ]);

  const rooms = [
    "role:admin",
    student?.class_id ? `class:${student.class_id}` : null,
    `student:${student_id}`,
    teacherMapping?.teacher_id ? `teacher:${teacherMapping.teacher_id}` : null,
    parent?.parent_id ? `parent:${parent.parent_id}` : null,
  ].filter(Boolean);

  publishDomainEvent(submission.marks == null ? "submission.created" : "submission.updated", {
    resource: "assignments",
    action: submission.marks == null ? "submitted" : "graded",
    assignment_id,
    student_id,
    rooms,
    submission,
    assignment,
  });

  return submission;
}
