import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarClock, CheckCircle2, Flame, Sparkles } from "lucide-react";
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
  const nextTask = tasks[0];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Student learning hub"
        title="Student Dashboard"
        subtitle="A focused workspace with just the next tasks, the current attendance signal, and the fastest path to help."
        actions={
          <>
            <Badge tone="success">{attendancePercent}% attendance</Badge>
            <Badge tone="brand">{tasks.length} tasks</Badge>
            <Badge tone="success"><Flame className="mr-1 inline size-3" />7 day streak</Badge>
            <PrimaryButton onClick={() => navigate({ to: "/assistant" })}>Open AI tutor</PrimaryButton>
            <SecondaryButton onClick={() => navigate({ to: "/student/attendance" })}>View attendance</SecondaryButton>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5">
          <SectionTitle action={<Badge tone="brand">Today</Badge>} description="The next work items only. No extra panels to scan before starting.">
            Today’s focus
          </SectionTitle>
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <motion.div
                key={task.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-2xl border border-border/70 bg-secondary/25 px-4 py-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{task.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Due {task.due}</p>
                  </div>
                  <Badge tone={task.status === "Urgent" ? "warning" : task.status === "In progress" ? "brand" : "success"}>{task.status}</Badge>
                </div>
                <div className="mt-3 h-2 rounded-full bg-muted/50">
                  <div
                    className={`h-2 rounded-full ${index === 0 ? "bg-warning-500" : index === 1 ? "bg-brand-500" : "bg-success-500"}`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </motion.div>
            ))}
            {tasks.length === 0 && <p className="text-sm text-muted-foreground">No assignments are due right now.</p>}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Attendance</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{attendancePercent}%</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Average mark</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{averageMark}%</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Subjects</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{subjectCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle action={<Badge tone="success">Next step</Badge>} description="One compact action list that helps the student move forward faster.">
            Quick actions
          </SectionTitle>
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
              <p className="text-sm font-semibold text-foreground">Start here</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {nextTask
                  ? `${nextTask.title} is the first item to clear before moving to the next subject.`
                  : "Open attendance or the AI tutor to decide the next study block."}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-brand-50/70 p-4 dark:bg-brand-500/10">
              <p className="text-sm font-semibold text-foreground">Simple routine</p>
              <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                <p className="flex items-center gap-2"><CalendarClock className="size-4 text-brand-600" />Open the timetable and check the next class.</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success-600" />Finish one task before opening another subject.</p>
                <p className="flex items-center gap-2"><Sparkles className="size-4 text-brand-600" />Ask the AI tutor for a hint when you get stuck.</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <PrimaryButton onClick={() => navigate({ to: "/assistant" })}>Open AI tutor</PrimaryButton>
              <SecondaryButton onClick={() => navigate({ to: "/student/attendance" })}>Open attendance</SecondaryButton>
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