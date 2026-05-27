import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Clock3, KanbanSquare, FileCheck2, Sparkles } from "lucide-react";
import { Card, PageHeader, SectionTitle, Badge, ProgressBar, EmptyState, PrimaryButton, SecondaryButton } from "@/components/app/ui-bits";
import { resolveStudentId } from "@/lib/defaults";
import { useSaveSubmission, useStudentAssignments, type StudentAssignment } from "@/hooks/api-hooks";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/student/assignments")({
  head: () => ({ meta: [{ title: "Assignments — AetherLMS" }] }),
  component: StudentAssignmentsPage,
});

function StudentAssignmentsPage() {
  const studentId = resolveStudentId(null);
  const { data: assignments, isLoading, isError } = useStudentAssignments(studentId);
  const saveSubmission = useSaveSubmission();
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { notes: string; attachment_name: string; attachment_url: string }>
  >({});
  const pending = (assignments ?? []).filter((assignment) => assignment.status === "pending");
  const submitted = (assignments ?? []).filter((assignment) => assignment.status === "submitted");

  function openUploadEditor(assignment: StudentAssignment) {
    setEditingAssignmentId(assignment.assignment_id);
    setDrafts((current) => ({
      ...current,
      [assignment.assignment_id]: current[assignment.assignment_id] ?? {
        notes: assignment.submission_notes ?? "",
        attachment_name: assignment.attachment_name ?? "",
        attachment_url: assignment.attachment_url ?? "",
      },
    }));
  }

  function closeUploadEditor() {
    setEditingAssignmentId(null);
  }

  function updateDraft(assignmentId: string, field: "notes" | "attachment_name" | "attachment_url", value: string) {
    setDrafts((current) => ({
      ...current,
      [assignmentId]: {
        notes: current[assignmentId]?.notes ?? "",
        attachment_name: current[assignmentId]?.attachment_name ?? "",
        attachment_url: current[assignmentId]?.attachment_url ?? "",
        [field]: value,
      },
    }));
  }

  function saveUploadDetails(assignmentId: string) {
    if (!studentId) return;
    const draft = drafts[assignmentId] ?? { notes: "", attachment_name: "", attachment_url: "" };
    saveSubmission.mutate(
      {
        assignmentId,
        payload: {
          student_id: studentId,
          notes: draft.notes.trim() ? draft.notes : undefined,
          attachment_name: draft.attachment_name.trim() ? draft.attachment_name : undefined,
          attachment_url: draft.attachment_url.trim() ? draft.attachment_url : undefined,
        },
      },
      { onSuccess: () => closeUploadEditor() },
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Student assignments"
        title="Assignments"
        subtitle={`Student ${studentId} with a cleaner Kanban-style overview, urgency cues, and submission progress.`}
        actions={<Badge tone="brand">{assignments?.length ?? 0} items</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5">
          <SectionTitle action={<Badge tone="brand">Focus</Badge>} description="Use the list below as a real study queue, not a passive summary.">
            Study lane
          </SectionTitle>
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-3">
              <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{pending.length} pending tasks</p>
                    <p className="mt-1 text-sm text-muted-foreground">{submitted.length} already submitted</p>
                  </div>
                  <Badge tone={pending.length > 0 ? "warning" : "success"}>{pending.length > 0 ? "Needs work" : "All clear"}</Badge>
                </div>
              </div>
              <div className="space-y-3">
                {pending.slice(0, 3).map((assignment) => (
                  <div key={`lane-${assignment.assignment_id}`} className="rounded-2xl border border-border/70 bg-card px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">{assignment.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{assignment.subject} • Due {new Date(assignment.due_date).toLocaleDateString()}</p>
                  </div>
                ))}
                {pending.length === 0 && <p className="text-sm text-muted-foreground">You are caught up for now.</p>}
              </div>
            </div>
            <div className="space-y-3 rounded-3xl border border-border/70 bg-brand-50/50 p-4 dark:bg-brand-500/10">
              <p className="text-sm font-semibold text-foreground">Task actions</p>
              <div className="grid gap-2">
                <PrimaryButton>Open next task</PrimaryButton>
                <SecondaryButton>Ask AI for a hint</SecondaryButton>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm text-foreground">
                Finish one urgent task before moving to a new subject.
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle action={<Badge tone="success">Momentum</Badge>} description="A quick view of the work that is already done and what still needs marks.">
            Submission rhythm
          </SectionTitle>
          <div className="space-y-3">
            <div className="rounded-2xl border border-border/70 bg-secondary/25 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Submission progress</p>
              <p className="mt-1 text-sm text-muted-foreground">Keep one assignment active at a time to reduce task switching.</p>
              <div className="mt-3">
                <ProgressBar value={pending.length || 25} tone="warning" />
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-brand-50/70 px-4 py-3 dark:bg-brand-500/10">
              <p className="text-sm font-semibold text-foreground">Submit early tip</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">If a task is nearly done, submit it before starting a new one so feedback comes back sooner.</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle action={<Badge tone="brand">{assignments?.length ?? 0} items</Badge>} description="A board-style layout with stronger urgency cues and more readable task cards.">
          Assignment board
        </SectionTitle>
        <div className="grid gap-4 lg:grid-cols-3">
          {isLoading && Array.from({ length: 3 }).map((_, index) => (
            <div key={`assignment-skeleton-${index}`} className="rounded-2xl border border-border/70 p-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-2 h-3 w-28" />
            </div>
          ))}
          {isError && <p className="text-sm text-danger">Failed to load assignments.</p>}

          <div className="rounded-3xl border border-border/70 bg-secondary/20 p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Pending</p>
              <Badge tone="warning">{pending.length}</Badge>
            </div>
            <div className="space-y-3">
              {pending.map((assignment) => (
                <div key={assignment.assignment_id} className="rounded-2xl border border-border/70 bg-card p-4">
                  <p className="font-semibold text-foreground">{assignment.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{assignment.subject} • Due {new Date(assignment.due_date).toLocaleDateString()}</p>
                  {assignment.attachment_url && (
                    <a
                      href={assignment.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
                    >
                      {assignment.attachment_name || "Open upload"}
                    </a>
                  )}
                  <div className="mt-3">
                    <ProgressBar value={35} tone="warning" />
                  </div>
                  <div className="mt-3">
                    <SecondaryButton type="button" onClick={() => openUploadEditor(assignment)}>
                      {editingAssignmentId === assignment.assignment_id ? "Editing upload" : "Upload details"}
                    </SecondaryButton>
                  </div>
                  {editingAssignmentId === assignment.assignment_id && (
                    <div className="mt-3 space-y-2 rounded-2xl border border-border/70 bg-secondary/25 p-3">
                      <input
                        value={drafts[assignment.assignment_id]?.attachment_name ?? ""}
                        onChange={(event) => updateDraft(assignment.assignment_id, "attachment_name", event.target.value)}
                        className="w-full rounded-xl border border-border/70 bg-card px-3 py-2 text-sm"
                        placeholder="Attachment name"
                      />
                      <input
                        value={drafts[assignment.assignment_id]?.attachment_url ?? ""}
                        onChange={(event) => updateDraft(assignment.assignment_id, "attachment_url", event.target.value)}
                        className="w-full rounded-xl border border-border/70 bg-card px-3 py-2 text-sm"
                        placeholder="Attachment URL"
                      />
                      <textarea
                        value={drafts[assignment.assignment_id]?.notes ?? ""}
                        onChange={(event) => updateDraft(assignment.assignment_id, "notes", event.target.value)}
                        className="min-h-20 w-full rounded-xl border border-border/70 bg-card px-3 py-2 text-sm"
                        placeholder="Submission notes"
                      />
                      <div className="flex flex-wrap gap-2">
                        <PrimaryButton type="button" onClick={() => saveUploadDetails(assignment.assignment_id)} disabled={saveSubmission.isPending}>
                          {saveSubmission.isPending ? "Saving..." : "Save details"}
                        </PrimaryButton>
                        <SecondaryButton type="button" onClick={closeUploadEditor}>Cancel</SecondaryButton>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {!isLoading && !isError && pending.length === 0 && <EmptyState title="All caught up" description="No pending tasks are waiting right now." />}
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-secondary/20 p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Submitted</p>
              <Badge tone="success">{submitted.length}</Badge>
            </div>
            <div className="space-y-3">
              {submitted.map((assignment) => (
                <div key={assignment.assignment_id} className="rounded-2xl border border-border/70 bg-card p-4">
                  <p className="font-semibold text-foreground">{assignment.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{assignment.subject} • Marked {assignment.submission_marks ?? 0}/100</p>
                  {assignment.attachment_url && (
                    <a
                      href={assignment.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
                    >
                      {assignment.attachment_name || "Open upload"}
                    </a>
                  )}
                  <div className="mt-3">
                    <ProgressBar value={assignment.submission_marks ?? 86} tone="success" />
                  </div>
                  <div className="mt-3">
                    <SecondaryButton type="button" onClick={() => openUploadEditor(assignment)}>
                      Edit upload details
                    </SecondaryButton>
                  </div>
                  {editingAssignmentId === assignment.assignment_id && (
                    <div className="mt-3 space-y-2 rounded-2xl border border-border/70 bg-secondary/25 p-3">
                      <input
                        value={drafts[assignment.assignment_id]?.attachment_name ?? ""}
                        onChange={(event) => updateDraft(assignment.assignment_id, "attachment_name", event.target.value)}
                        className="w-full rounded-xl border border-border/70 bg-card px-3 py-2 text-sm"
                        placeholder="Attachment name"
                      />
                      <input
                        value={drafts[assignment.assignment_id]?.attachment_url ?? ""}
                        onChange={(event) => updateDraft(assignment.assignment_id, "attachment_url", event.target.value)}
                        className="w-full rounded-xl border border-border/70 bg-card px-3 py-2 text-sm"
                        placeholder="Attachment URL"
                      />
                      <textarea
                        value={drafts[assignment.assignment_id]?.notes ?? ""}
                        onChange={(event) => updateDraft(assignment.assignment_id, "notes", event.target.value)}
                        className="min-h-20 w-full rounded-xl border border-border/70 bg-card px-3 py-2 text-sm"
                        placeholder="Submission notes"
                      />
                      <div className="flex flex-wrap gap-2">
                        <PrimaryButton type="button" onClick={() => saveUploadDetails(assignment.assignment_id)} disabled={saveSubmission.isPending}>
                          {saveSubmission.isPending ? "Saving..." : "Save details"}
                        </PrimaryButton>
                        <SecondaryButton type="button" onClick={closeUploadEditor}>Cancel</SecondaryButton>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {!isLoading && !isError && submitted.length === 0 && <EmptyState title="Nothing submitted yet" description="Submitted work will appear here with marks and progress." />}
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-secondary/20 p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Submission history</p>
              <Badge tone="brand">Latest</Badge>
            </div>
            <div className="space-y-3">
              {(assignments ?? []).slice(0, 4).map((assignment) => (
                <div key={`history-${assignment.assignment_id}`} className="rounded-2xl border border-border/70 bg-card p-4">
                  <p className="font-semibold text-foreground">{assignment.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{assignment.subject} • {assignment.status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}