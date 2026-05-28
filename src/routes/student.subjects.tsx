import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { BookOpen } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Card, PageHeader, SectionTitle, Badge, ProgressBar } from "@/components/app/ui-bits";
import { resolveStudentId } from "@/lib/defaults";
import { useMarks } from "@/hooks/api-hooks";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/student/subjects")({
  head: () => ({ meta: [{ title: "Subjects — AetherLMS" }] }),
  component: StudentSubjectsPage,
});

function StudentSubjectsPage() {
  const studentId = resolveStudentId(null);
  const { data: marks, isLoading, isError } = useMarks(studentId);

  const subjects = useMemo(() => {
    const map = new Map<string, { total: number; max: number; count: number }>();
    (marks ?? []).forEach((mark) => {
      const current = map.get(mark.subject) ?? { total: 0, max: 0, count: 0 };
      map.set(mark.subject, {
        total: current.total + mark.marks,
        max: current.max + mark.max_marks,
        count: current.count + 1,
      });
    });
    return Array.from(map.entries()).map(([subject, totals]) => ({
      subject,
      percent: totals.max ? Math.round((totals.total / totals.max) * 100) : 0,
      count: totals.count,
    }));
  }, [marks]);

  const trend = useMemo(() => {
    const map = new Map<string, { total: number; max: number }>();
    (marks ?? []).forEach((item) => {
      const current = map.get(item.exam) ?? { total: 0, max: 0 };
      map.set(item.exam, { total: current.total + item.marks, max: current.max + item.max_marks });
    });
    return Array.from(map.entries()).map(([exam, totals]) => ({
      exam,
      score: totals.max ? Math.round((totals.total / totals.max) * 100) : 0,
    }));
  }, [marks]);

  const average = subjects.length ? Math.round(subjects.reduce((sum, item) => sum + item.percent, 0) / subjects.length) : 0;
  const weakest = subjects.slice().sort((a, b) => a.percent - b.percent)[0];
  const strongest = subjects.slice().sort((a, b) => b.percent - a.percent)[0];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Student subjects"
        title="Subjects"
        subtitle={`Academic progress for ${studentId} in a lighter layout with the useful bits first.`}
        actions={<Badge tone="brand">{subjects.length} subjects</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <Card className="p-5">
          <SectionTitle action={<Badge tone="brand">Snapshot</Badge>} description="One summary row and one table keep the useful information within a single glance.">
            Subject results
          </SectionTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Average</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{average}%</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Weakest</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{weakest ? weakest.subject : "No data"}</p>
              <p className="text-xs text-muted-foreground">{weakest ? `${weakest.percent}%` : ""}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Strongest</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{strongest ? strongest.subject : "No data"}</p>
              <p className="text-xs text-muted-foreground">{strongest ? `${strongest.percent}%` : ""}</p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Average</th>
                  <th className="px-4 py-3">Assessments</th>
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
                {isError && !isLoading && (
                  <tr>
                    <td className="px-4 py-4 text-danger" colSpan={3}>
                      Failed to load marks.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && subjects.length === 0 && (
                  <tr>
                    <td className="px-4 py-4 text-muted-foreground" colSpan={3}>
                      No subject marks found.
                    </td>
                  </tr>
                )}
                {subjects.map((subject) => (
                  <tr key={subject.subject} className="transition hover:bg-secondary/30">
                    <td className="px-4 py-4 font-medium text-foreground">{subject.subject}</td>
                    <td className="px-4 py-4">
                      <div className="max-w-xs">
                        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{subject.percent}%</span>
                          <span>{subject.percent >= 85 ? "Strong" : subject.percent >= 70 ? "Steady" : "Needs focus"}</span>
                        </div>
                        <ProgressBar value={subject.percent} tone={subject.percent >= 85 ? "success" : subject.percent >= 70 ? "brand" : "warning"} />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{subject.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle action={<Badge tone="success">Trend</Badge>} description="A smaller chart with a short note keeps the page readable on mobile too.">
            Performance trend
          </SectionTitle>
          <div className="h-72">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-2xl" />
            ) : trend.length > 0 ? (
              <ResponsiveContainer>
                <LineChart data={trend} margin={{ left: -12, right: 8 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="exam" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 16 }} />
                  <Line type="monotone" dataKey="score" stroke="var(--brand-600)" strokeWidth={3} dot={{ r: 4, fill: "var(--brand-600)" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border/70 text-sm text-muted-foreground">
                No trend data yet.
              </div>
            )}
          </div>
          <div className="mt-4 rounded-2xl border border-border/70 bg-brand-50/70 p-4 dark:bg-brand-500/10">
            <p className="text-sm font-semibold text-foreground">Next step</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Work on the weakest subject first, then keep the strongest one warm with a short review block.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}