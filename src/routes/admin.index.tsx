import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  BadgeAlert,
  BellRing,
  ClipboardCheck,
  GraduationCap,
  Landmark,
  Sparkles,
  Users,
} from "lucide-react";
import { useClassAnalyticsQueries, usePayments, useStudents, useTeachers, useTimetable } from "@/hooks/api-hooks";
import {
  Badge,
  Card,
  PageHeader,
  SectionTitle,
  PrimaryButton,
  SecondaryButton,
  ProgressBar,
} from "@/components/app/ui-bits";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — AetherLMS" }] }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { data: students } = useStudents();
  const { data: teachers } = useTeachers();
  const { data: payments } = usePayments();
  const { data: timetable } = useTimetable();

  const classIds = useMemo(
    () => Array.from(new Set((students ?? []).map((student) => student.class_id))).slice(0, 4),
    [students],
  );
  const classAnalytics = useClassAnalyticsQueries(classIds);

  const departmentData = useMemo(
    () =>
      classAnalytics
        .map((result) => result.data)
        .filter(Boolean)
        .map((item) => ({
          name: item!.class_id,
          score: item!.attendance_rate,
        })),
    [classAnalytics],
  );

  const weeklyData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const slotsByDay = new Map(days.map((day) => [day, 0]));
    const revenueByDay = new Map(days.map((day) => [day, 0]));
    let maxSlots = 1;
    let maxRevenue = 1;

    for (const slot of timetable ?? []) {
      const day = slot.day.slice(0, 3);
      const current = (slotsByDay.get(day) ?? 0) + 1;
      slotsByDay.set(day, current);
      maxSlots = Math.max(maxSlots, current);
    }

    for (const payment of payments ?? []) {
      const day = new Date(payment.date).toLocaleDateString("en-US", { weekday: "short" });
      const current = (revenueByDay.get(day) ?? 0) + payment.amount;
      revenueByDay.set(day, current);
      maxRevenue = Math.max(maxRevenue, current);
    }

    return days.map((day) => ({
      day,
      attendance: Math.round(((slotsByDay.get(day) ?? 0) / maxSlots) * 100),
      revenue: Math.round(((revenueByDay.get(day) ?? 0) / maxRevenue) * 100),
    }));
  }, [payments, timetable]);

  const alerts = useMemo(() => {
    const lowestAttendance = classAnalytics
      .map((result) => result.data)
      .filter(Boolean)
      .sort((left, right) => left!.attendance_rate - right!.attendance_rate)[0];

    return [
      {
        title: `${teachers?.length ?? 0} teaching staff synced`,
        detail: "The staff directory is now backed by live backend records.",
        tone: "success" as const,
      },
      {
        title: `Ledger contains ${payments?.length ?? 0} recent payments`,
        detail: "Payment updates now flow through realtime cache invalidation.",
        tone: "brand" as const,
      },
      {
        title: lowestAttendance
          ? `Class ${lowestAttendance.class_id} attendance is ${lowestAttendance.attendance_rate}%`
          : "Attendance analytics are loading",
        detail: lowestAttendance
          ? "Use the live class insights page to review the weakest cohort first."
          : "Class-level attendance insights will appear as soon as analytics load.",
        tone: lowestAttendance && lowestAttendance.attendance_rate < 90 ? "warning" : "success",
      },
    ];
  }, [classAnalytics, teachers?.length, payments?.length]);

  const activity = useMemo(
    () => [
      ...(payments ?? []).slice(0, 2).map((payment) => ({
        label: `${payment.method} payment from ${payment.student_id}`,
        time: new Date(payment.date).toLocaleDateString(),
      })),
      ...(timetable ?? []).slice(0, 2).map((slot) => ({
        label: `${slot.class_id} ${slot.subject} scheduled`,
        time: `${slot.day} · ${slot.start_time}`,
      })),
    ],
    [payments, timetable],
  );

  const liveAnalytics = classAnalytics.map((result) => result.data).filter(Boolean);
  const averageAttendance = liveAnalytics.length
    ? Math.round(liveAnalytics.reduce((sum, item) => sum + item!.attendance_rate, 0) / liveAnalytics.length)
    : 0;

  const verifiedRate = payments?.length
    ? Math.round(((payments.filter((payment) => payment.method === "UPI").length ?? 0) / payments.length) * 100)
    : 0;

  const timetableCoverage = timetable?.length
    ? Math.min(100, Math.round((timetable.length / Math.max(1, classIds.length * 5)) * 100))
    : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Institution overview"
        title="Admin Dashboard"
        subtitle="A clear leadership overview that brings attendance, academics, finance, and alerts together in one workspace."
        actions={
          <>
            <Badge tone="success"><BellRing className="mr-1 inline size-3" />Live sync</Badge>
            <PrimaryButton><Sparkles className="size-4" />Generate report</PrimaryButton>
            <SecondaryButton>Export PDF</SecondaryButton>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="p-5">
          <SectionTitle action={<Badge tone="warning">Needs attention</Badge>} description="Use this list to review and approve the most important operational items first.">
            Priority actions
          </SectionTitle>
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-3">
              {[
                { title: "Review attendance dips in Grade 10-B", note: "Create a teacher follow-up and parent update." },
                { title: "Approve the fee recovery batch", note: "Release once the finance lead signs off." },
                { title: "Review staff profile updates", note: "Check records needing designation changes." },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-border/70 bg-secondary/25 px-4 py-3 text-sm text-foreground">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.note}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3 rounded-3xl border border-border/70 bg-brand-50/50 p-4 dark:bg-brand-500/10">
              <p className="text-sm font-semibold text-foreground">Fast path</p>
              <div className="space-y-2 text-sm leading-6 text-muted-foreground">
                <p>Use the queue for decisions instead of scanning a fourth summary card.</p>
                <p>Broadcast one leadership update instead of sending three separate messages.</p>
              </div>
              <div className="grid gap-2 pt-1">
                <button className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-left text-sm font-medium text-foreground transition hover:border-brand-300">
                  Review now
                </button>
                <button className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-left text-sm font-medium text-foreground transition hover:border-brand-300">
                  Send update
                </button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle action={<Badge tone="brand">Today</Badge>} description="A concise view of the day’s priorities and approvals.">
            Daily overview
          </SectionTitle>
          <div className="space-y-3">
            <div className="rounded-2xl border border-border/70 bg-secondary/25 px-4 py-3 text-sm text-foreground">
              <p className="font-medium">Morning check-in</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Attendance review and late entry monitoring before first period.</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-secondary/25 px-4 py-3 text-sm text-foreground">
              <p className="font-medium">Afternoon approval</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Finance batch and staff profile updates need leadership sign-off.</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-brand-50/70 px-4 py-3 dark:bg-brand-500/10">
              <p className="text-sm font-semibold text-foreground">Quick actions</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-left text-sm font-medium text-foreground transition hover:border-brand-300">
                  Open reports
                </button>
                <button className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-left text-sm font-medium text-foreground transition hover:border-brand-300">
                  Export PDF
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <Card>
          <SectionTitle
            description="Weekly overview across attendance, academics, and financial operations."
            action={<Badge tone="brand">Last 7 days</Badge>}
          >
            Institutional Overview
          </SectionTitle>
          <div className="h-[340px] px-2 py-4 md:px-4">
            <ResponsiveContainer>
              <AreaChart
                data={weeklyData}
              >
                <defs>
                  <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-500)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--brand-500)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "0 16px 36px -24px rgba(15,23,42,0.35)" }} />
                <Area type="monotone" dataKey="attendance" stroke="var(--brand-600)" fill="url(#attendanceFill)" strokeWidth={3} />
                <Area type="monotone" dataKey="revenue" stroke="var(--success)" fillOpacity={0} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <SectionTitle action={<Badge tone="warning">Needs attention</Badge>}>Alert Center</SectionTitle>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.title} className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{alert.detail}</p>
                    </div>
                    <Badge tone={alert.tone}>{alert.tone}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle action={<Badge tone="brand">Timeline</Badge>}>Activity Feed</SectionTitle>
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <Card>
          <SectionTitle action={<Badge tone="brand">Department score</Badge>}>Performance by Department</SectionTitle>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={departmentData} layout="vertical" margin={{ left: 10, right: 12 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={12} width={120} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 16 }} />
                <Bar dataKey="score" radius={[0, 12, 12, 0]} fill="var(--brand-600)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle action={<Badge tone="success">Healthy</Badge>}>Operational Snapshot</SectionTitle>
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Academic delivery</span>
                <span className="text-muted-foreground">{averageAttendance}%</span>
              </div>
              <ProgressBar value={averageAttendance} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Finance collection</span>
                <span className="text-muted-foreground">{verifiedRate}%</span>
              </div>
              <ProgressBar value={verifiedRate} tone="success" />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Student wellbeing</span>
                <span className="text-muted-foreground">{timetableCoverage}%</span>
              </div>
              <ProgressBar value={timetableCoverage} tone="brand" />
            </div>
            <div className="rounded-2xl border border-border/70 bg-brand-50/70 p-4 dark:bg-brand-500/10">
              <p className="text-sm font-semibold text-foreground">Leadership summary</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The school is operating in a stable range. Attendance and finance are both trending upward while two academic interventions remain top priority.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}