import { AppError } from "../utils/appError.js";
import { ok } from "../utils/apiResponse.js";
import { publishDomainEvent } from "../server/events/domainEvents.js";
import {
  getNotificationsForParent as getNotificationsForParentService,
  getUnreadNotificationCount,
  listNotificationsForStudent,
  markNotificationRead,
} from "../services/notificationService.js";

export async function getNotificationsForStudent(req, res) {
  const studentId = req.params.studentId;
  const notifications = await listNotificationsForStudent(studentId);
  return ok(res, notifications);
}

export async function getNotificationsForParent(req, res) {
  const notifications = await getNotificationsForParentService(req.params.parentId);
  return ok(res, notifications);
}

export async function getUnreadNotificationsCount(req, res) {
  const studentId = req.params.studentId;
  const unreadCount = await getUnreadNotificationCount(studentId);
  return ok(res, { student_id: studentId, unread_count: unreadCount });
}

export async function markNotificationAsRead(req, res) {
  const notification = await markNotificationRead(req.params.notificationId);
  if (!notification) {
    throw new AppError("Notification not found.", 404);
  }

  publishDomainEvent("notification.read", {
    resource: "notifications",
    action: "read",
    student_id: notification.student_id,
    parent_id: notification.parent_id,
    rooms: [
      "role:admin",
      notification.student_id ? `student:${notification.student_id}` : null,
      notification.parent_id ? `parent:${notification.parent_id}` : null,
    ].filter(Boolean),
    notification,
  });

  return ok(res, notification);
}