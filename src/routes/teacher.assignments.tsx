import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { FormEvent } from "react";
import { FilePlus2, Sparkles, ClipboardList, CheckCircle2 } from "lucide-react";
import { Card, PageHeader, SectionTitle, Badge, ProgressBar, EmptyState, PrimaryButton, SecondaryButton } from "@/components/app/ui-bits";
import { resolveTeacherClassId } from "@/lib/defaults";
import { useAssignments, useCreateAssignment } from "@/hooks/api-hooks";

export const Route = createFileRoute("/teacher/assignments")({
  head: () => ({ meta: [{ title: "Teacher Assignments — AetherLMS" }] }),
  component: TeacherAssignmentsPage,
});

function TeacherAssignmentsPage() {
  const classId = resolveTeacherClassId();
  const { data: assignments, isLoading } = useAssignments(classId);
  const createMutation = useCreateAssignment();
  const [form, setForm] = useState({ class_id: classId, subject: "", title: "" });
  const submissionCount = (assignments ?? []).reduce((sum, assignment) => sum + Number(assignment.submissions_count ?? 0), 0);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    createMutation.mutate(form);
    setForm((prev) => ({ ...prev, subject: "", title: "" }));
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Teacher assignments"
        title="Assignments to Grade"
        subtitle={`Class ${classId} with assignment creation, progress analytics, and more readable cards.`}
        actions={<Badge tone="brand">{assignments?.length ?? 0} items</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5">
          <SectionTitle action={<Badge tone="brand">Create faster</Badge>} description="Use one hub to launch assignments, prompts, and grading prep.">
            Assignment studio
          </SectionTitle>
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-3">
              {[
                "Keep the subject aligned to the lesson plan",
                "Use AI for quiz and worksheet prompts",
                "Review submissions before adding a new task",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-border/70 bg-secondary/25 px-4 py-3 text-sm text-foreground">
                  {item}
                </div>
              ))}
            </div>
            <div className="space-y-3 rounded-3xl border border-border/70 bg-brand-50/50 p-4 dark:bg-brand-500/10">
              <p className="text-sm font-semibold text-foreground">Launch tools</p>
              <div className="grid gap-2">
                <PrimaryButton><FilePlus2 className="mr-2 size-4" />New assignment</PrimaryButton>
                <SecondaryButton><Sparkles className="mr-2 size-4" />AI prompt helper</SecondaryButton>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">Keep titles short, attach clear instructions, and only add the next task once the current one is visible to students.</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle action={<Badge tone="success">Queue</Badge>} description="A compact look at what needs attention next.">
            Grading workflow
          </SectionTitle>
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Submission total</p>
                  <p className="text-sm text-muted-foreground">Across all attached assignments</p>
                </div>
                <span className="text-2xl font-bold text-foreground">{submissionCount}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-brand-50/70 p-4 dark:bg-brand-500/10">
              <p className="text-sm font-semibold text-foreground">Teacher note</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Check one assignment at a time and mark the highest-priority submissions first to keep feedback timely.</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <Card>
          <SectionTitle action={<Badge tone="brand">Create</Badge>} description="A cleaner assignment composer with better spacing and a calmer call-to-action.">
            Create assignment
          </SectionTitle>
          <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
            <input value={form.class_id} onChange={(e) => setForm((prev) => ({ ...prev, class_id: e.target.value }))} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm" placeholder="Class" required />
            <input value={form.subject} onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm" placeholder="Subject" required />
            <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm md:col-span-2" placeholder="Title" required />
            <PrimaryButton type="submit" disabled={createMutation.isPending} className="md:col-span-2">
              {createMutation.isPending ? "Saving..." : "Create assignment"}
            </PrimaryButton>
          </form>
        </Card>

        <Card>
          <SectionTitle action={<Badge tone="success">Healthy</Badge>}>Grading progress</SectionTitle>
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-foreground">Current completion</span>
                <span className="text-muted-foreground">72%</span>
              </div>
              <ProgressBar value={72} tone="success" />
            </div>
            <div className="rounded-2xl border border-border/70 bg-brand-50/70 p-4 dark:bg-brand-500/10">
              <p className="text-sm font-semibold text-foreground">Teacher note</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Use the template-driven workflow to reduce repetitive task creation and keep grading feedback consistent.</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle action={<Badge tone="brand">{assignments?.length ?? 0} items</Badge>} description="A richer list of assignment cards with visible metadata and submission context.">
          Assignments
        </SectionTitle>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading assignments...</p>}
          {!isLoading && (assignments ?? []).length === 0 && (
            <EmptyState
              title="No assignments found"
              description="Create a new assignment to start tracking submissions and grading progress."
              icon={FilePlus2}
            />
          )}
          {(assignments ?? []).map((assignment) => (
            <Card key={assignment.assignment_id} hoverable className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{assignment.title}</p>
                  <p className="text-xs text-muted-foreground">{assignment.subject}</p>
                </div>
                <Badge tone="brand">{assignment.submissions_count ?? 0} submissions</Badge>
              </div>
              <div className="mt-4 rounded-2xl border border-border/70 bg-secondary/30 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">Submission progress</span>
                  <span className="text-muted-foreground">{Math.min(100, Number(assignment.submissions_count ?? 0) * 10)}%</span>
                </div>
                <div className="mt-3">
                  <ProgressBar value={Math.min(100, Number(assignment.submissions_count ?? 0) * 10)} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}