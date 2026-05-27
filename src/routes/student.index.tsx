import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarClock, Flame, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, PageHeader, SectionTitle, Badge, PrimaryButton, SecondaryButton, ProgressBar } from "@/components/app/ui-bits";
import { useAuth } from "@/hooks/use-auth";
import { useAttendanceSummary, useMarks, useStudentAssignments, useStudents } from "@/hooks/api-hooks";

export const Route = createFileRoute("/student/")({
  head: () => ({ meta: [{ title: "Student Dashboard — AetherLMS" }] }),
  component: StudentDashboardPage,
});

function StudentDashboardPage() {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { data: students } = useStudents();
  const studentId = auth?.role === "student" ? auth.identifier : students?.[0]?.student_id;
  const { data: assignments } = useStudentAssignments(studentId);
  const { data: attendanceSummary } = useAttendanceSummary(studentId);
  const { data: marks } = useMarks(studentId);

  const tasks = useMemo(
    () =>
      (assignments ?? []).slice(0, 3).map((assignment, index) => ({
        title: assignment.title,
        due: new Date(assignment.due_date).toLocaleDateString(),
        status:
          assignment.status === "submitted"
            ? "Submitted"
            : index === 0
              ? "Urgent"
              : "In progress",
        progress: assignment.status === "submitted" ? 100 : Math.max(35, 80 - index * 18),
      })),
    [assignments],
  );

  const attendancePercent = attendanceSummary?.overall.attendance_percent ?? 0;
  const subjectCount = attendanceSummary?.subjects.length ?? 0;
  const averageMark = marks?.length
    ? Math.round(marks.reduce((sum, record) => sum + record.marks, 0) / marks.length)
    : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Student learning hub"
        title="Student Dashboard"
        subtitle="A focused learning workspace that surfaces progress, deadlines, study habits, and AI support."
        actions={
          <>
            <Badge tone="success"><Flame className="mr-1 inline size-3" />7 day streak</Badge>
            <PrimaryButton onClick={() => navigate({ to: "/assistant" })}>Open AI tutor</PrimaryButton>
            <SecondaryButton onClick={() => navigate({ to: "/student/attendance" })}>View schedule</SecondaryButton>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5">
          <SectionTitle action={<Badge tone="brand">Today</Badge>} description="See what to complete next without scanning a wall of metrics.">
            Today’s tasks
          </SectionTitle>
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <motion.div
                  key={task.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-2xl border border-border/70 bg-secondary/25 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{task.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">Due {task.due}</p>
                    </div>
                    <Badge tone={task.status === "Urgent" ? "warning" : task.status === "In progress" ? "brand" : "neutral"}>{task.status}</Badge>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-muted/50">
                    <div className={`h-2 rounded-full ${index === 0 ? "bg-warning-500" : index === 1 ? "bg-brand-500" : "bg-success-500"}`} style={{ width: `${task.progress}%` }} />
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="space-y-3 rounded-3xl border border-border/70 bg-brand-50/50 p-4 dark:bg-brand-500/10">
              <p className="text-sm font-semibold text-foreground">Study tools</p>
              <div className="space-y-2 text-sm leading-6 text-muted-foreground">
                <p className="flex items-center gap-2"><CalendarClock className="size-4 text-brand-600" />Open your timetable and jump to the next class.</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success-600" />Check off the assignment you can finish in 20 minutes.</p>
                <p className="flex items-center gap-2"><Sparkles className="size-4 text-brand-600" />Ask the AI tutor for one hint, not the full answer.</p>
              </div>
              <div className="grid gap-2 pt-1">
                <PrimaryButton onClick={() => navigate({ to: "/assistant" })}>Open AI tutor</PrimaryButton>
                <SecondaryButton onClick={() => navigate({ to: "/student/attendance" })}>View calendar</SecondaryButton>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle action={<Badge tone="success">Momentum</Badge>} description="A weekly overview of progress and study habits.">
            Weekly overview
          </SectionTitle>
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
              <p className="text-sm font-semibold text-foreground">Today’s plan</p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
                <li>Finish the highest priority assignment before the end of lunch.</li>
                <li>Use one revision block for the subject with the lowest mark.</li>
                <li>Open the attendance summary before planning the next study block.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border/70 bg-brand-50/70 p-4 dark:bg-brand-500/10">
              <p className="text-sm font-semibold text-foreground">Study consistency</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Your attendance is currently {attendancePercent}% across {subjectCount} tracked subjects. Keep the short-block routine and the marks will follow.</p>
            </div>
            <div className="rounded-2xl border border-border/70 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-foreground">Assignments completed</span>
                <span className="text-muted-foreground">{Math.min(100, tasks.filter((task) => task.status === "Submitted").length * 34 + tasks.length * 10)}%</span>
              </div>
              <ProgressBar value={Math.min(100, tasks.filter((task) => task.status === "Submitted").length * 34 + tasks.length * 10)} tone="success" />
              <div className="mt-4 mb-2 flex items-center justify-between text-sm">
                <span className="text-foreground">Exam readiness</span>
                <span className="text-muted-foreground">{averageMark}%</span>
              </div>
              <ProgressBar value={averageMark} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}