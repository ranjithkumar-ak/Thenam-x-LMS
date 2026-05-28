import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, PageHeader, SectionTitle, Badge, ProgressBar } from "@/components/app/ui-bits";
import { resolveTeacherClassId } from "@/lib/defaults";
import { useClassAnalytics } from "@/hooks/api-hooks";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/teacher/insights")({
  head: () => ({ meta: [{ title: "Class Insights — AetherLMS" }] }),
  component: TeacherInsightsPage,
});

function TeacherInsightsPage() {
  const classId = resolveTeacherClassId();
  const { data: analytics, isLoading, isError } = useClassAnalytics(classId);
  const subjectScores = analytics?.subject_scores ?? [];
  const topSubject = subjectScores.slice().sort((a, b) => b.averageScore - a.averageScore)[0];
  const weakSubject = subjectScores.slice().sort((a, b) => a.averageScore - b.averageScore)[0];
  const averageScore = analytics?.average_score ?? 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Teacher analytics"
        title="Class Insights"
        subtitle={`Analytics for ${classId} with only the insights that help decide the next lesson.`}
        actions={
          <>
            <Badge tone="brand">Insights live</Badge>
            <Badge tone="success">{analytics?.attendance_rate ?? 0}% attendance</Badge>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-5">
          <SectionTitle action={<Badge tone="success">Next action</Badge>} description="One summary strip makes the important teaching signals easier to read.">
            Teaching signal
          </SectionTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Students</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{analytics?.student_count ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Attendance</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{analytics?.attendance_rate ?? 0}%</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Average score</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{averageScore}%</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-border/70 bg-brand-50/70 p-4 dark:bg-brand-500/10">
            <p className="text-sm font-semibold text-foreground">Lesson focus</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {weakSubject
                ? `Spend the next lesson on ${weakSubject.subject}; it is the clearest area for quick improvement.`
                : "Once marks arrive, the weakest subject will appear here as the next focus."}
            </p>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle action={<Badge tone="brand">Support</Badge>} description="Keep the follow-up actions short and directly tied to the numbers.">
            Quick actions
          </SectionTitle>
          <div className="space-y-3">
            <div className="rounded-2xl border border-border/70 bg-secondary/25 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Top subject</p>
              <p className="mt-1 text-sm text-muted-foreground">{topSubject ? `${topSubject.subject} (${topSubject.averageScore}%)` : "No data yet"}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-secondary/25 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Weakest subject</p>
              <p className="mt-1 text-sm text-muted-foreground">{weakSubject ? `${weakSubject.subject} (${weakSubject.averageScore}%)` : "No data yet"}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-brand-50/70 px-4 py-3 dark:bg-brand-500/10">
              <p className="text-sm font-semibold text-foreground">Intervention tip</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">If attendance is steady, a small score intervention usually gives the fastest lift.</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle action={<Badge tone="brand">{subjectScores.length} subjects</Badge>} description="A chart plus a short score list is enough to identify the next lesson focus.">
          Subject performance
        </SectionTitle>
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="h-72">
              {isLoading ? (
                <Skeleton className="h-full w-full rounded-2xl" />
              ) : subjectScores.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart data={subjectScores} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="subject" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 16 }} />
                    <Bar dataKey="averageScore" radius={[10, 10, 0, 0]} fill="var(--brand-600)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border/70 text-sm text-muted-foreground">
                  No subject insights available yet.
                </div>
              )}
            </div>
            {isError && <p className="mt-4 text-sm text-danger">Failed to load class analytics.</p>}
          </div>

          <div className="space-y-3">
            {subjectScores.map((item) => (
              <div key={item.subject} className="rounded-2xl border border-border/70 bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{item.subject}</p>
                    <p className="text-xs text-muted-foreground">{item.entries} assessment(s)</p>
                  </div>
                  <span className="text-lg font-bold text-foreground">{item.averageScore}%</span>
                </div>
                <div className="mt-4">
                  <ProgressBar value={item.averageScore} tone={item.averageScore >= 80 ? "success" : item.averageScore >= 65 ? "brand" : "warning"} />
                </div>
              </div>
            ))}
            {!isLoading && !isError && subjectScores.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                Once enough marks are recorded, the subject performance list will appear here.
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}