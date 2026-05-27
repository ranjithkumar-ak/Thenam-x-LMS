import { Class } from "../models/Class.js";
import { Mapping } from "../models/Mapping.js";
import { Teacher } from "../models/Teacher.js";
import { Timetable } from "../models/Timetable.js";

const SLOT_TIMES = [
  { start_time: "08:30", end_time: "09:15", period: 1 },
  { start_time: "09:20", end_time: "10:05", period: 2 },
  { start_time: "10:20", end_time: "11:05", period: 3 },
  { start_time: "11:10", end_time: "11:55", period: 4 },
  { start_time: "12:30", end_time: "13:15", period: 5 },
  { start_time: "13:20", end_time: "14:05", period: 6 },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function buildTimetableId(payload) {
  return `${payload.class_id}-${payload.day}-${payload.period}`;
}

export async function listTimetable() {
  const existing = await Timetable.find({}, { _id: 0 }).sort({ day: 1, period: 1 }).lean();
  if (existing.length) return existing;

  const [classes, mappings, teachers] = await Promise.all([
    Class.find({}, { _id: 0 }).lean(),
    Mapping.find({}, { _id: 0 }).lean(),
    Teacher.find({}, { _id: 0 }).lean(),
  ]);

  const teacherMap = new Map(teachers.map((teacher) => [teacher.teacher_id, teacher]));
  const classMap = new Map(classes.map((item) => [item.class_id, item]));

  const generated = mappings.map((entry, index) => {
    const teacher = teacherMap.get(entry.teacher_id);
    const classRecord = classMap.get(entry.class_id);
    const slot = SLOT_TIMES[index % SLOT_TIMES.length];
    const day = DAYS[Math.floor(index / SLOT_TIMES.length) % DAYS.length];

    return {
      timetable_id: `${entry.class_id}-${entry.subject}-${index + 1}`,
      day,
      ...slot,
      class_id: entry.class_id,
      grade: classRecord?.grade ?? null,
      section: classRecord?.section ?? null,
      subject: entry.subject,
      teacher_id: entry.teacher_id,
      teacher_name: teacher?.name ?? entry.teacher_id,
      room: `Room ${200 + (index % 10)}`,
      status: "scheduled",
    };
  });

  if (generated.length) {
    await Timetable.insertMany(generated, { ordered: false }).catch(() => {});
  }

  return Timetable.find({}, { _id: 0 }).sort({ day: 1, period: 1 }).lean();
}

export async function getTimetableByTeacher(teacherId) {
  return Timetable.find({ teacher_id: teacherId }, { _id: 0 }).sort({ day: 1, period: 1 }).lean();
}

export async function createTimetableEntry(payload) {
  const timetable_id = payload.timetable_id || buildTimetableId(payload);
  const entry = await Timetable.findOneAndUpdate(
    { timetable_id },
    {
      $set: {
        timetable_id,
        day: payload.day,
        period: payload.period,
        start_time: payload.start_time,
        end_time: payload.end_time,
        class_id: payload.class_id,
        subject: payload.subject,
        teacher_id: payload.teacher_id,
        teacher_name: payload.teacher_name,
        room: payload.room,
        status: payload.status || "scheduled",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  return entry;
}
