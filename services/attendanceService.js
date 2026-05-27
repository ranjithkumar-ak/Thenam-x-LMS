import { Attendance } from "../models/Attendance.js";
import { Parent } from "../models/Parent.js";
import { Mapping } from "../models/Mapping.js";
import { publishDomainEvent } from "../server/events/domainEvents.js";

export async function getAttendanceByStudent(studentId) {
  return Attendance.find({ student_id: studentId }, { _id: 0 }).sort({ date: -1 }).lean();
}

export async function getAttendanceByClass(classId) {
  return Attendance.find({ class_id: classId }, { _id: 0 }).sort({ date: -1, student_id: 1 }).lean();
}

export async function createOrUpdateAttendance({ student_id, class_id, date, status }) {
  const normalizedDate = new Date(date);
  const dayStart = new Date(normalizedDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(normalizedDate);
  dayEnd.setHours(23, 59, 59, 999);

  const record = await Attendance.findOneAndUpdate(
    { student_id, class_id, date: { $gte: dayStart, $lte: dayEnd } },
    { $set: { student_id, class_id, date: normalizedDate, status } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  const [teacherMapping, parent] = await Promise.all([
    Mapping.findOne({ class_id }, { _id: 0 }).lean(),
    Parent.findOne({ student_id }, { _id: 0 }).lean(),
  ]);

  const rooms = [
    "role:admin",
    `class:${class_id}`,
    `student:${student_id}`,
    teacherMapping?.teacher_id ? `teacher:${teacherMapping.teacher_id}` : null,
    parent?.parent_id ? `parent:${parent.parent_id}` : null,
  ].filter(Boolean);

  publishDomainEvent("attendance.upserted", {
    resource: "attendance",
    action: "upserted",
    student_id,
    class_id,
    rooms,
    attendance: record,
  });

  return record;
}

export async function getStudentAttendanceSummary(studentId) {
  const records = await getAttendanceByStudent(studentId);
  if (!records.length) {
    return {
      student_id: studentId,
      overall: { attended_sessions: 0, total_sessions: 0, attendance_percent: 0 },
      subjects: [],
    };
  }

  const classId = records[0].class_id;
  const mappings = await Mapping.find({ class_id: classId }, { _id: 0 }).lean();
  const subjects = mappings.map((entry) => entry.subject);

  const subjectBuckets = new Map();
  records.forEach((record, index) => {
    const subject = subjects.length ? subjects[index % subjects.length] : "General";
    const current = subjectBuckets.get(subject) ?? { attended_sessions: 0, total_sessions: 0 };
    current.total_sessions += 1;
    if (record.status === "present") current.attended_sessions += 1;
    subjectBuckets.set(subject, current);
  });

  const subjectSummary = Array.from(subjectBuckets.entries()).map(([subject, values]) => ({
    subject,
    attended_sessions: values.attended_sessions,
    total_sessions: values.total_sessions,
    attendance_percent: values.total_sessions
      ? Math.round((values.attended_sessions / values.total_sessions) * 100)
      : 0,
  }));

  const totalSessions = records.length;
  const attendedSessions = records.filter((record) => record.status === "present").length;

  return {
    student_id: studentId,
    overall: {
      attended_sessions: attendedSessions,
      total_sessions: totalSessions,
      attendance_percent: totalSessions ? Math.round((attendedSessions / totalSessions) * 100) : 0,
    },
    subjects: subjectSummary,
  };
}
