import { Attendance } from "../models/Attendance.js";
import { Assignment } from "../models/Assignment.js";
import { Fees } from "../models/Fees.js";
import { Marks } from "../models/Marks.js";
import { Notification } from "../models/Notification.js";
import { Parent } from "../models/Parent.js";
import { Student } from "../models/Student.js";

function buildDerivedNotifications({ attendance, assignments, fees, marks }) {
  const notifications = [];

  const absent = attendance.find((entry) => entry.status === "absent");
  if (absent) {
    notifications.push({
      notification_id: `att-${absent.student_id}-${String(absent.date).slice(0, 10)}`,
      type: "attendance",
      title: "Absent record logged",
      message: `Attendance recorded as absent on ${new Date(absent.date).toLocaleDateString()}`,
      severity: "warning",
      date: absent.date,
      read: false,
    });
  }

  if (marks.length) {
    const latestMark = marks[0];
    notifications.push({
      notification_id: `mark-${latestMark.student_id}-${latestMark.subject}-${latestMark.exam}`,
      type: "result",
      title: `${latestMark.subject} result available`,
      message: `${latestMark.exam}: ${latestMark.marks}/${latestMark.max_marks}`,
      severity: "success",
      date: new Date(),
      read: false,
    });
  }

  if (fees && fees.balance > 0) {
    notifications.push({
      notification_id: `fee-${fees.student_id}`,
      type: "fees",
      title: "Tuition balance due",
      message: `Outstanding balance is ${fees.balance.toLocaleString()}`, 
      severity: "danger",
      date: new Date(),
      read: false,
    });
  }

  if (assignments.length) {
    const latestAssignment = assignments[0];
    notifications.push({
      notification_id: `assignment-${latestAssignment.assignment_id}`,
      type: "assignment",
      title: "New assignment assigned",
      message: `${latestAssignment.title} for ${latestAssignment.subject}`,
      severity: "brand",
      date: new Date(),
      read: false,
    });
  }

  return notifications;
}

export async function createNotification(payload) {
  const notification = await Notification.create({
    notification_id: payload.notification_id,
    student_id: payload.student_id,
    class_id: payload.class_id,
    parent_id: payload.parent_id,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    severity: payload.severity || "brand",
    metadata: payload.metadata || {},
  });

  return notification.toObject();
}

export async function listNotificationsForStudent(studentId) {
  const [storedNotifications, student] = await Promise.all([
    Notification.find({ student_id: studentId }, { _id: 0 }).sort({ createdAt: -1 }).limit(50).lean(),
    Student.findOne({ student_id: studentId }, { _id: 0 }).lean(),
  ]);

  if (storedNotifications.length) {
    return storedNotifications.map((notification) => ({
      notification_id: notification.notification_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      severity: notification.severity,
      date: notification.createdAt,
      read: notification.read,
    }));
  }

  if (!student) return [];

  const [attendance, assignments, fees, marks] = await Promise.all([
    Attendance.find({ student_id: studentId }, { _id: 0 }).sort({ date: -1 }).limit(5).lean(),
    Assignment.find({ class_id: student.class_id }, { _id: 0 }).sort({ class_id: 1, subject: 1 }).limit(5).lean(),
    Fees.findOne({ student_id: studentId }, { _id: 0 }).lean(),
    Marks.find({ student_id: studentId }, { _id: 0 }).sort({ exam: -1, subject: 1 }).limit(5).lean(),
  ]);

  return buildDerivedNotifications({ attendance, assignments, fees, marks });
}

export async function getNotificationsForParent(parentId) {
  const parent = await Parent.findOne({ parent_id: parentId }, { _id: 0 }).lean();
  if (!parent) return [];

  return listNotificationsForStudent(parent.student_id);
}

export async function getUnreadNotificationCount(studentId) {
  return Notification.countDocuments({ student_id: studentId, read: false });
}

export async function markNotificationRead(notificationId) {
  return Notification.findOneAndUpdate(
    { notification_id: notificationId },
    { $set: { read: true } },
    { new: true },
  ).lean();
}
