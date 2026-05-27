import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowRight, CalendarDays, HeartHandshake, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import { Card, PageHeader, SectionTitle, Badge, ProgressBar, SecondaryButton } from "@/components/app/ui-bits";
import { useAuth } from "@/hooks/use-auth";
import { useAttendanceSummary, useNotifications, useParentOverview, useStudents } from "@/hooks/api-hooks";

export const Route = createFileRoute("/parent/")({
  head: () => ({ meta: [{ title: "Parent Dashboard — AetherLMS" }] }),
  component: ParentDashboardPage,
});

function ParentDashboardPage() {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { data: students } = useStudents();
  const parentId = auth?.role === "parent" ? auth.identifier : undefined;
  const { data: overview } = useParentOverview(parentId);
  const childStudentId = overview?.student?.student_id ?? students?.[0]?.student_id;
  const { data: fallbackAttendance } = useAttendanceSummary(childStudentId);
  const { data: fallbackNotifications } = useNotifications(childStudentId);

  const notes = useMemo(
    () =>
      (overview?.notifications?.length ? overview.notifications : fallbackNotifications ?? [])
        .slice(0, 3)
        .map((notification) => ({
          title: notification.title,
          detail: notification.message,
        })),
    [fallbackNotifications, overview?.notifications],
  );

  const attendancePercent = overview?.attendanceSummary?.overall.attendance_percent ?? fallbackAttendance?.overall.attendance_percent ?? 0;
  const homeworkPercent = overview?.assignments?.length
    ? Math.round((overview.assignments.filter((assignment) => assignment.status === "submitted").length / overview.assignments.length) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Family portal"
        title="Parent Dashboard"
        subtitle="A reassuring view of attendance, communication, and academic progress designed to feel calm and easy to trust."
        actions={<SecondaryButton onClick={() => navigate({ to: "/parent/notifications" })}>Message teacher</SecondaryButton>}
      />

      <Card className="p-5">
        <SectionTitle action={<Badge tone="success">Calm plan</Badge>} description="Keep the next conversation simple: one message, one check-in, one follow-up.">
          Conversation window
        </SectionTitle>
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.title} className="rounded-2xl border border-border/70 bg-secondary/25 px-4 py-3">
                <p className="text-sm font-semibold text-foreground">{note.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{note.detail}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3 rounded-3xl border border-border/70 bg-brand-50/50 p-4 dark:bg-brand-500/10">
            <p className="text-sm font-semibold text-foreground">Parent rhythm</p>
            <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
              <li>Check the inbox once in the evening.</li>
              <li>Use the attendance note to guide tonight’s routine.</li>
              <li>Keep the meeting list visible before the week starts.</li>
            </ul>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <SectionTitle action={<Badge tone="brand">Child overview</Badge>} description="A concise snapshot of school life without information overload.">
            Child progress
          </SectionTitle>
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-foreground">Attendance</span>
                <span className="text-muted-foreground">{attendancePercent}%</span>
              </div>
              <ProgressBar value={attendancePercent} tone="success" />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-foreground">Homework completion</span>
                <span className="text-muted-foreground">{homeworkPercent}%</span>
              </div>
              <ProgressBar value={homeworkPercent} />
            </div>
            <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
              <p className="text-sm font-semibold text-foreground">Teacher note</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {overview?.student
                  ? `Child progress is synced from ${overview.student.class_id}. Attendance and notifications update in real time.`
                  : "Child progress will appear once the parent account is linked to a student record."}
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <SectionTitle action={<Badge tone="warning">Needs review</Badge>}>Notifications</SectionTitle>
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.title} className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{note.title}</p>
                    <p className="text-sm leading-6 text-muted-foreground">{note.detail}</p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle action={<Badge tone="success">Calm</Badge>}>Parent guidance</SectionTitle>
            <div className="rounded-2xl border border-border/70 bg-brand-50/70 p-4 dark:bg-brand-500/10">
              <p className="text-sm font-semibold text-foreground">Recommended next step</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Encourage a 20-minute study block before dinner and review the latest teacher message together this evening.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}