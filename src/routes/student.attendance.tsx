import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, PageHeader, SectionTitle, Badge, ProgressBar, EmptyState, PrimaryButton, SecondaryButton } from "@/components/app/ui-bits";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveStudentId } from "@/lib/defaults";
import { useAttendance, useAttendanceSummary } from "@/hooks/api-hooks";
import { queueAssistantPrompt } from "../lib/assistantPrompt";

export const Route = createFileRoute("/student/attendance")({
  head: () => ({ meta: [{ title: "Attendance — AetherLMS" }] }),
  component: StudentAttendancePage,
});

function StudentAttendancePage() {
  const navigate = useNavigate();
  const studentId = resolveStudentId(null);
  const { data: attendance, isLoading, isError } = useAttendance(studentId);
  const { data: summary, isLoading: summaryLoading } = useAttendanceSummary(studentId);

  const stats = useMemo(() => {
    const total = attendance?.length ?? 0;
    const present = attendance?.filter((record) => record.status === "present").length ?? 0;
    return { total, present, percent: total ? Math.round((present / total) * 100) : 0 };
  }, [attendance]);
  const absent = stats.total - stats.present;

  function openAssistant(prompt: string) {
    queueAssistantPrompt(prompt);
    navigate({ to: "/assistant" });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Student attendance"
        title="Attendance"
        subtitle={`Tracking records for ${studentId} in a simpler layout with the next action first.`}
        actions={<Badge tone="brand"><ShieldCheck className="mr-1 inline size-3" />Verified records</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-5">
          <SectionTitle action={<Badge tone="success">What to do</Badge>} description="A quick summary followed by the one action that matters most.">
            Attendance snapshot
          </SectionTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Present</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{stats.present}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Absent</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{absent}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Attendance</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{stats.percent}%</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-border/70 bg-brand-50/70 p-4 dark:bg-brand-500/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Current status</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stats.percent >= 95 ? "You are on target for the school benchmark." : "A short catch-up with the teacher will help close the gap."}
                </p>
              </div>
              <Badge tone={stats.percent >= 95 ? "success" : "warning"}>{stats.percent >= 95 ? "On target" : "Needs review"}</Badge>
            </div>
            <div className="mt-4">
              <ProgressBar value={stats.percent} tone={stats.percent >= 95 ? "success" : "brand"} />
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <PrimaryButton type="button" onClick={() => openAssistant("Help me plan my study time around today's classes and attendance.")}>Plan my day</PrimaryButton>
            <SecondaryButton type="button" onClick={() => openAssistant("Draft a short message to my teacher asking for help with attendance or missed classes.")}>Draft teacher note</SecondaryButton>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle action={<Badge tone="brand">Live signal</Badge>} description="Keep the routine simple: review one missed class at a time.">
            Attendance summary
          </SectionTitle>
          <div className="space-y-3">
            <div className="rounded-2xl border border-border/70 bg-secondary/25 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Catch-up rule</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Review missed sessions within 24 hours so they do not become a backlog.</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-brand-50/70 px-4 py-3 dark:bg-brand-500/10">
              <p className="text-sm font-semibold text-foreground">Best next step</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Use the subject chart below to find the one class that needs extra attention first.</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-secondary/25 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Quick signal</p>
              <p className="mt-1 text-sm text-muted-foreground">{summaryLoading ? "Loading subject breakdown..." : `${summary?.subjects.length ?? 0} subjects with attendance data.`}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <SectionTitle action={<Badge tone="brand">Subject-wise</Badge>} description="A gentle visual breakdown of attendance percent across subjects.">
            Attendance by subject
          </SectionTitle>
          <div className="h-72">
            {summaryLoading ? (
              <Skeleton className="h-full w-full rounded-2xl" />
            ) : (
              <ResponsiveContainer>
                <BarChart data={summary?.subjects ?? []} margin={{ left: -12, right: 12 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="subject" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip
                    formatter={(_value, _key, row) => {
                      const payload = row?.payload;
                      if (!payload) return _value;
                      return [`${payload.attended_sessions}/${payload.total_sessions}`, "Sessions"];
                    }}
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 16 }}
                  />
                  <Bar dataKey="attendance_percent" fill="var(--brand-600)" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle action={<Badge tone="success">Stable</Badge>}>Attendance insights</SectionTitle>
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-foreground">Target threshold</span>
                <span className="text-muted-foreground">95%</span>
              </div>
              <ProgressBar value={stats.percent} tone={stats.percent >= 95 ? "success" : "brand"} />
            </div>
            <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4">
              <p className="text-sm font-semibold text-foreground">Quick take</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Attendance is consistent enough to support strong academic momentum. Keep the current routine and review any missed sessions early.</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-brand-50/70 p-4 dark:bg-brand-500/10">
              <p className="text-sm font-semibold text-foreground">Next best action</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Use the subject chart to identify whether a single class needs extra revision or catch-up time.</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle action={<Badge tone="brand">Live data</Badge>}>Recent sessions</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td className="px-4 py-4" colSpan={3}>
                    <Skeleton className="h-6 w-full" />
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td className="px-4 py-4 text-danger" colSpan={3}>
                    Failed to load attendance.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && (attendance ?? []).length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-muted-foreground" colSpan={3}>
                    No attendance records found.
                  </td>
                </tr>
              )}
              {(attendance ?? []).map((record) => (
                <tr key={`${record.student_id}-${record.date}`} className="transition hover:bg-secondary/30">
                  <td className="px-4 py-4">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="px-4 py-4">{record.class_id}</td>
                  <td className="px-4 py-4">
                    <Badge tone={record.status === "present" ? "success" : "danger"}>
                      {record.status === "present" ? <CheckCircle2 className="mr-1 inline size-3" /> : <XCircle className="mr-1 inline size-3" />}
                      {record.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}