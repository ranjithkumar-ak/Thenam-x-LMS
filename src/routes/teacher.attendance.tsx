import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, ShieldCheck, XCircle } from "lucide-react";
import { Card, PageHeader, SectionTitle, Badge, ProgressBar, PrimaryButton, SecondaryButton } from "@/components/app/ui-bits";
import { resolveTeacherClassId } from "@/lib/defaults";
import { useClassAttendance, useCreateAttendance, useStudentsByClass } from "@/hooks/api-hooks";
import { queueAssistantPrompt } from "../lib/assistantPrompt";

export const Route = createFileRoute("/teacher/attendance")({
  head: () => ({ meta: [{ title: "Teacher Attendance — AetherLMS" }] }),
  component: TeacherAttendancePage,
});

function TeacherAttendancePage() {
  const navigate = useNavigate();
  const classId = resolveTeacherClassId();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [statusMap, setStatusMap] = useState<Record<string, "present" | "absent">>({});
  const { data: attendance, isLoading, isError } = useClassAttendance(classId);
  const { data: students } = useStudentsByClass(classId);
  const markMutation = useCreateAttendance();

  const todaysRows = useMemo(
    () => (students ?? []).map((student) => ({
      student_id: student.student_id,
      name: student.name,
      status: statusMap[student.student_id] ?? "present",
    })),
    [statusMap, students],
  );

  const presentCount = todaysRows.filter((row) => row.status === "present").length;
  const absentCount = todaysRows.filter((row) => row.status === "absent").length;
  const attendanceRate = todaysRows.length ? Math.round((presentCount / todaysRows.length) * 100) : 0;

  const submitAttendance = () => {
    todaysRows.forEach((row) => {
      markMutation.mutate({ student_id: row.student_id, class_id: classId, date, status: row.status });
    });
  };

  function draftParentNote() {
    queueAssistantPrompt(`Draft a short parent note for class ${classId} attendance on ${date}. Include the attendance summary and a calm follow-up tone.`);
    navigate({ to: "/assistant" });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Teacher attendance"
        title="Class Attendance"
        subtitle={`Live class log for ${classId} with the shortest path from marking to saving.`}
        actions={<Badge tone="brand">Mark attendance</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-5">
          <SectionTitle action={<Badge tone="brand">Mark once</Badge>} description="Keep attendance fast: mark the class once and save once.">
            Mark attendance
          </SectionTitle>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Class size</p>
                  <p className="mt-1 text-sm text-muted-foreground">{todaysRows.length} students on the roster</p>
                </div>
                <Badge tone="brand">Today</Badge>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-card p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{presentCount}</p>
                  <p className="text-xs text-muted-foreground">Present</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{absentCount}</p>
                  <p className="text-xs text-muted-foreground">Absent</p>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-foreground">Present rate</span>
                <span className="text-muted-foreground">{attendanceRate}%</span>
              </div>
              <ProgressBar value={attendanceRate} tone="success" />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-foreground">Absent rate</span>
                <span className="text-muted-foreground">{todaysRows.length ? Math.round((absentCount / todaysRows.length) * 100) : 0}%</span>
              </div>
              <ProgressBar value={todaysRows.length ? (absentCount / todaysRows.length) * 100 : 0} tone="warning" />
            </div>

            <div className="rounded-2xl border border-border/70 bg-brand-50/70 p-4 dark:bg-brand-500/10">
              <p className="text-sm font-semibold text-foreground">Workflow tip</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Mark the whole class, then save once to keep the audit trail clean and fast.</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <PrimaryButton type="button" onClick={submitAttendance} disabled={markMutation.isPending}>
                {markMutation.isPending ? "Saving..." : "Save attendance"}
              </PrimaryButton>
              <SecondaryButton type="button" onClick={draftParentNote}>Draft parent note</SecondaryButton>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle action={<Badge tone="success">Stable</Badge>} description="Keep the routine simple: review one missed class at a time.">
            Attendance summary
          </SectionTitle>
          <div className="space-y-3">
            <div className="rounded-2xl border border-border/70 bg-secondary/25 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Catch-up rule</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Review missed sessions within 24 hours so they do not become a backlog.</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-brand-50/70 px-4 py-3 dark:bg-brand-500/10">
              <p className="text-sm font-semibold text-foreground">Best next step</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Use the roster below to find the one student who needs attention first.</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-secondary/25 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Quick signal</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isLoading ? "Loading session history..." : `${attendance?.length ?? 0} recent records.`}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle action={<Badge tone="brand">Mark attendance</Badge>} description="A simple roster list works better on small screens than a dense grid.">
          Roster
        </SectionTitle>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm"
          />
          <PrimaryButton type="button" onClick={submitAttendance} disabled={markMutation.isPending}>
            {markMutation.isPending ? "Saving..." : "Save attendance"}
          </PrimaryButton>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {todaysRows.map((row) => (
            <div key={row.student_id} className="rounded-2xl border border-border/70 bg-secondary/20 p-4 text-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium text-foreground">{row.name}</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusMap((previous) => ({ ...previous, [row.student_id]: "present" }))}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${row.status === "present" ? "border-success/20 bg-success/10 text-success" : "border-border/70 bg-card text-muted-foreground hover:border-success/20 hover:text-foreground"}`}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusMap((previous) => ({ ...previous, [row.student_id]: "absent" }))}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${row.status === "absent" ? "border-warning/20 bg-warning/15 text-warning" : "border-border/70 bg-card text-muted-foreground hover:border-warning/20 hover:text-foreground"}`}
                  >
                    Absent
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle action={<Badge tone="success">Recent</Badge>}>Recent sessions</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td className="px-4 py-3 text-muted-foreground" colSpan={3}>
                    Loading attendance...
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td className="px-4 py-3 text-danger" colSpan={3}>
                    Failed to load attendance.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && (attendance ?? []).length === 0 && (
                <tr>
                  <td className="px-4 py-3 text-muted-foreground" colSpan={3}>
                    No attendance records found.
                  </td>
                </tr>
              )}
              {(attendance ?? []).map((record) => (
                <tr key={`${record.student_id}-${record.date}`} className="transition hover:bg-secondary/30">
                  <td className="px-4 py-3">{record.student_id}</td>
                  <td className="px-4 py-3">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Badge tone={record.status === "present" ? "success" : "warning"}>
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