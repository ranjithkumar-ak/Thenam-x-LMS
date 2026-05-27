import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  CalendarClock,
  ClipboardCheck,
  Sparkles,
  BellRing,
} from "lucide-react";
import { Card, PageHeader, SectionTitle, Badge, PrimaryButton, SecondaryButton, ProgressBar } from "@/components/app/ui-bits";
import { useAuth } from "@/hooks/use-auth";
import { useAssignments, useClassAttendance, useClassAnalytics, useTeachers, useTimetableByTeacher } from "@/hooks/api-hooks";

export const Route = createFileRoute("/teacher/")({
  head: () => ({ meta: [{ title: "Teacher Dashboard — AetherLMS" }] }),
  component: TeacherDashboardPage,
});

function TeacherDashboardPage() {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { data: teachers } = useTeachers();
  const teacherId = auth?.role === "teacher" ? auth.identifier : teachers?.[0]?.teacher_id;
  const { data: timetable } = useTimetableByTeacher(teacherId);
  const primaryClassId = timetable?.[0]?.class_id;
  const { data: attendance } = useClassAttendance(primaryClassId);
  const { data: assignments } = useAssignments(primaryClassId);
  const { data: analytics } = useClassAnalytics(primaryClassId);

  const schedule = useMemo(
    () =>
      (timetable ?? []).slice(0, 3).map((entry, index) => ({
        time: entry.start_time,
        className: `${entry.class_id} ${entry.subject}`,
        room: entry.room,
        status: index === 0 ? "Today" : index === 1 ? "Next" : "Prep",
      })),
    [timetable],
  );

  const presentCount = attendance?.filter((row) => row.status === "present").length ?? 0;
  const attendanceRate = attendance?.length ? Math.round((presentCount / attendance.length) * 100) : 0;
  const gradedAssignments = assignments?.filter((item) => (item as { average_marks?: number | null }).average_marks != null).length ?? 0;
  const gradingRate = assignments?.length ? Math.round((gradedAssignments / assignments.length) * 100) : 0;
  const classScore = analytics?.attendance_rate ?? 0;
  const nextLesson = schedule[0];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Teacher workspace"
        title="Teacher Dashboard"
        subtitle="A simpler teaching workspace with the next lesson, attendance, and grading actions in one place."
        actions={
          <>
            <Badge tone="success">{attendanceRate}% attendance</Badge>
            <Badge tone="brand">{gradingRate}% graded</Badge>
            <Badge tone="brand"><Sparkles className="mr-1 inline size-3" />AI grading helper</Badge>
            <PrimaryButton onClick={() => navigate({ to: "/teacher/attendance" })}>Mark attendance</PrimaryButton>
            <SecondaryButton onClick={() => navigate({ to: "/teacher/assignments" })}>Create assignment</SecondaryButton>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5">
          <SectionTitle action={<Badge tone="brand">Now</Badge>} description="See today’s teaching schedule and next steps at a glance.">
            Today’s schedule
          </SectionTitle>
          <div className="space-y-3">
            {schedule.map((item, index) => (
              <motion.div
                key={item.time}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl border border-border/70 bg-secondary/25 px-4 py-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      <CalendarClock className="size-4 text-brand-600" />
                      {item.time}
                    </div>
                    <p className="mt-1 font-semibold text-foreground">{item.className}</p>
                    <p className="text-sm text-muted-foreground">{item.room}</p>
                  </div>
                  <Badge tone={index === 0 ? "success" : index === 1 ? "brand" : "neutral"}>{item.status}</Badge>
                </div>
              </motion.div>
            ))}
            {schedule.length === 0 && <p className="text-sm text-muted-foreground">No timetable items found.</p>}
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle action={<Badge tone="warning">Actions</Badge>} description="Keep the most common classroom actions right at hand.">
            Quick actions
          </SectionTitle>
          <div className="space-y-3">
            <div className="rounded-2xl border border-border/70 bg-brand-50/50 p-4 dark:bg-brand-500/10">
              <p className="text-sm font-semibold text-foreground">Next lesson</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {nextLesson
                  ? `${nextLesson.className} in ${nextLesson.room} is the next scheduled class.`
                  : "Open the timetable and prep the next lesson from there."}
              </p>
            </div>
            <div className="grid gap-2">
              <button
                onClick={() => navigate({ to: "/teacher/attendance" })}
                className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-left text-sm font-medium text-foreground transition hover:border-brand-300"
              >
                <div className="flex items-center gap-2"><ClipboardCheck className="size-4 text-brand-600" />Mark attendance</div>
              </button>
              <button
                onClick={() => navigate({ to: "/assistant" })}
                className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-left text-sm font-medium text-foreground transition hover:border-brand-300"
              >
                <div className="flex items-center gap-2"><Sparkles className="size-4 text-brand-600" />Generate quiz prompt</div>
              </button>
              <button
                onClick={() => navigate({ to: "/parent/notifications" })}
                className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-left text-sm font-medium text-foreground transition hover:border-brand-300"
              >
                <div className="flex items-center gap-2"><BellRing className="size-4 text-brand-600" />Send parent note</div>
              </button>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle action={<Badge tone="success">Balanced</Badge>}>Attendance and grading</SectionTitle>
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-foreground">Attendance completion</span>
                <span className="text-muted-foreground">{attendanceRate}%</span>
              </div>
              <ProgressBar value={attendanceRate} tone="success" />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-foreground">Pending grading</span>
                <span className="text-muted-foreground">{gradingRate}%</span>
              </div>
              <ProgressBar value={gradingRate} tone="warning" />
            </div>
            <div className="rounded-2xl border border-border/70 bg-brand-50/70 p-4 text-sm leading-6 text-muted-foreground dark:bg-brand-500/10">
              {primaryClassId
                ? `Live class ${primaryClassId} is synced at ${classScore}% attendance, so you can adjust the lesson before it starts.`
                : "Connect a teacher timetable to unlock live attendance and grading summaries here."}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <button
              onClick={() => navigate({ to: "/teacher/attendance" })}
              className="rounded-2xl border border-border/70 bg-secondary/25 px-4 py-3 text-left text-sm font-medium text-foreground transition hover:border-brand-300"
            >
              <div className="flex items-center gap-2"><ClipboardCheck className="size-4 text-brand-600" />Mark attendance</div>
            </button>
            <button
              onClick={() => navigate({ to: "/assistant" })}
              className="rounded-2xl border border-border/70 bg-secondary/25 px-4 py-3 text-left text-sm font-medium text-foreground transition hover:border-brand-300"
            >
              <div className="flex items-center gap-2"><Sparkles className="size-4 text-brand-600" />Generate quiz prompt</div>
            </button>
            <button
              onClick={() => navigate({ to: "/parent/notifications" })}
              className="rounded-2xl border border-border/70 bg-secondary/25 px-4 py-3 text-left text-sm font-medium text-foreground transition hover:border-brand-300"
            >
              <div className="flex items-center gap-2"><BellRing className="size-4 text-brand-600" />Send parent note</div>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}