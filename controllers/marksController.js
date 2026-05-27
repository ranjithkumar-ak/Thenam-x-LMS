import { Marks } from "../models/Marks.js";
import { Parent } from "../models/Parent.js";
import { Student } from "../models/Student.js";
import { Mapping } from "../models/Mapping.js";
import { publishDomainEvent } from "../server/events/domainEvents.js";
import { created, ok } from "../utils/apiResponse.js";
import { positiveNumber, requireFields } from "../utils/validators.js";

export async function getMarksByStudent(req, res) {
  const records = await Marks.find({ student_id: req.params.studentId }, { _id: 0 })
    .sort({ subject: 1, exam: 1 })
    .lean();
  return ok(res, records);
}

export async function createMarks(req, res) {
  const { student_id, subject, exam, marks, max_marks } = req.body;
  requireFields(req.body, ["student_id", "subject", "exam", "marks", "max_marks"], "marks");

  const record = await Marks.create({
    student_id,
    subject,
    exam,
    marks: positiveNumber(marks, "marks"),
    max_marks: positiveNumber(max_marks, "max_marks"),
  });

  const student = await Student.findOne({ student_id }, { class_id: 1, _id: 0 }).lean();
  const [teacherMapping, parent] = await Promise.all([
    student?.class_id ? Mapping.findOne({ class_id: student.class_id }, { _id: 0 }).lean() : null,
    Parent.findOne({ student_id }, { _id: 0 }).lean(),
  ]);

  const rooms = [
    "role:admin",
    `student:${student_id}`,
    student?.class_id ? `class:${student.class_id}` : null,
    teacherMapping?.teacher_id ? `teacher:${teacherMapping.teacher_id}` : null,
    parent?.parent_id ? `parent:${parent.parent_id}` : null,
  ].filter(Boolean);

  publishDomainEvent("marks.created", {
    resource: "marks",
    action: "created",
    student_id,
    rooms,
    marks: record.toObject(),
  });

  return created(res, { ...record.toObject(), _id: undefined });
}
