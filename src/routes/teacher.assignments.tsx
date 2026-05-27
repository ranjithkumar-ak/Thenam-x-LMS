import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { FilePlus2, Sparkles } from "lucide-react";
import { Card, PageHeader, SectionTitle, Badge, ProgressBar, EmptyState, PrimaryButton, SecondaryButton } from "@/components/app/ui-bits";
import { resolveTeacherClassId } from "@/lib/defaults";
import { useAssignments, useCreateAssignment } from "@/hooks/api-hooks";
import { queueAssistantPrompt } from "../lib/assistantPrompt";

export const Route = createFileRoute("/teacher/assignments")({
  head: () => ({ meta: [{ title: "Teacher Assignments — AetherLMS" }] }),
  component: TeacherAssignmentsPage,
});

function TeacherAssignmentsPage() {
  const navigate = useNavigate();
  const classId = resolveTeacherClassId();
  const { data: assignments, isLoading } = useAssignments(classId);
  const createMutation = useCreateAssignment();
  const [form, setForm] = useState({ class_id: classId, subject: "", title: "" });
  const formRef = useRef<HTMLFormElement>(null);
  const submissionCount = (assignments ?? []).reduce((sum, assignment) => sum + Number(assignment.submissions_count ?? 0), 0);
  const totalAssignments = assignments?.length ?? 0;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    createMutation.mutate(form);
    setForm((prev) => ({ ...prev, subject: "", title: "" }));
  };

  function focusAssignmentForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    formRef.current?.querySelector<HTMLInputElement>("input")?.focus();
  }

  function openAiHelper() {
    queueAssistantPrompt(`Help me draft a concise assignment for class ${classId} in ${form.subject || "my subject"}.`);
    navigate({ to: "/assistant" });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Teacher assignments"
        title="Assignments"
        subtitle={`Class ${classId} with a shorter path from creating a task to checking submissions.`}
        actions={
          <>
            <Badge tone="brand">{totalAssignments} items</Badge>
            <Badge tone="success">{submissionCount} submissions</Badge>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-5">
          <SectionTitle action={<Badge tone="brand">Create fast</Badge>} description="Keep the creation form close to the summary so the workflow stays short.">
            Create assignment
          </SectionTitle>
          <div className="space-y-3">
            <div className="rounded-2xl border border-border/70 bg-secondary/25 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Submission total</p>
                  <p className="mt-1 text-sm text-muted-foreground">Across all assignments</p>
                </div>
                <span className="text-2xl font-bold text-foreground">{submissionCount}</span>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <PrimaryButton type="button" onClick={focusAssignmentForm}><FilePlus2 className="size-4" />New assignment</PrimaryButton>
              <SecondaryButton type="button" onClick={openAiHelper}><Sparkles className="size-4" />AI prompt helper</SecondaryButton>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle action={<Badge tone="success">Queue</Badge>} description="One place to see the class queue without extra dashboard cards.">
            Grading workflow
          </SectionTitle>
          <div className="rounded-2xl border border-border/70 bg-brand-50/70 p-4 dark:bg-brand-500/10">
            <p className="text-sm font-semibold text-foreground">Teacher note</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Check one assignment at a time and mark the highest-priority submissions first to keep feedback timely.</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <SectionTitle action={<Badge tone="brand">Create</Badge>} description="A cleaner assignment composer with only the required fields.">
            Assignment form
          </SectionTitle>
          <form ref={formRef} onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
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
        <SectionTitle action={<Badge tone="brand">{assignments?.length ?? 0} items</Badge>} description="A single list keeps the class work easier to scan on desktop and mobile.">
          Assignment list
        </SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Submissions</th>
                <th className="px-4 py-3">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td className="px-4 py-4 text-muted-foreground" colSpan={3}>
                    Loading assignments...
                  </td>
                </tr>
              )}
              {!isLoading && (assignments ?? []).length === 0 && (
                <tr>
                  <td className="px-4 py-4" colSpan={3}>
                    <EmptyState
                      title="No assignments found"
                      description="Create a new assignment to start tracking submissions and grading progress."
                      icon={FilePlus2}
                    />
                  </td>
                </tr>
              )}
              {(assignments ?? []).map((assignment) => (
                <tr key={assignment.assignment_id} className="transition hover:bg-secondary/30">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-foreground">{assignment.title}</p>
                    <p className="text-xs text-muted-foreground">{assignment.subject}</p>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{assignment.submissions_count ?? 0}</td>
                  <td className="px-4 py-4">
                    <div className="max-w-xs">
                      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{Math.min(100, Number(assignment.submissions_count ?? 0) * 10)}%</span>
                        <span>Submission flow</span>
                      </div>
                      <ProgressBar value={Math.min(100, Number(assignment.submissions_count ?? 0) * 10)} />
                    </div>
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