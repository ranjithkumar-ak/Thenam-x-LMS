import { created, ok } from "../utils/apiResponse.js";
import { requireFields } from "../utils/validators.js";
import { createTimetableEntry, getTimetableByTeacher as getTimetableByTeacherService, listTimetable } from "../services/timetableService.js";
import { publishDomainEvent } from "../server/events/domainEvents.js";

export async function getTimetable(req, res) {
  const timetable = await listTimetable();
  return ok(res, timetable);
}

export async function getTimetableByTeacher(req, res) {
  const timetable = await getTimetableByTeacherService(req.params.teacherId);
  return ok(res, timetable);
}

export async function createTimetable(req, res) {
  requireFields(
    req.body,
    ["day", "period", "start_time", "end_time", "class_id", "subject", "teacher_id", "teacher_name", "room"],
    "timetable",
  );

  const entry = await createTimetableEntry(req.body);
  publishDomainEvent("timetable.created", {
    resource: "timetable",
    action: "created",
    class_id: entry.class_id,
    teacher_id: entry.teacher_id,
    rooms: ["role:admin", `class:${entry.class_id}`, `teacher:${entry.teacher_id}`],
    timetable: entry,
  });
  return created(res, entry);
}