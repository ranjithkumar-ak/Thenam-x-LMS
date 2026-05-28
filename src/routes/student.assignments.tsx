import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Clock3, FileCheck2, Sparkles } from "lucide-react";
import { Card, PageHeader, SectionTitle, Badge, ProgressBar, EmptyState, PrimaryButton, SecondaryButton } from "@/components/app/ui-bits";
import { resolveStudentId } from "@/lib/defaults";
import { useSaveSubmission, useStudentAssignments, type StudentAssignment } from "@/hooks/api-hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { queueAssistantPrompt } from "../lib/assistantPrompt";

export const Route = createFileRoute("/student/assignments")({
  head: () => ({ meta: [{ title: "Assignments — AetherLMS" }] }),
  component: StudentAssignmentsPage,
});

function StudentAssignmentsPage() {
  const navigate = useNavigate();
  const studentId = resolveStudentId(null);
  const { data: assignments, isLoading, isError } = useStudentAssignments(studentId);
  const saveSubmission = useSaveSubmission();
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { notes: string; attachment_name: string; attachment_url: string }>
  >({});
  const pending = (assignments ?? []).filter((assignment) => assignment.status === "pending");
  const submitted = (assignments ?? []).filter((assignment) => assignment.status === "submitted");
  const totalAssignments = assignments?.length ?? 0;
  const nextPendingAssignment = pending[0] ?? assignments?.[0];

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

  function openNextTask() {
    if (!nextPendingAssignment) return;
    openUploadEditor(nextPendingAssignment);
  }

  function askForHint() {
    const assignment = nextPendingAssignment;
    const prompt = assignment
      ? `Give me a short hint for my ${assignment.subject} assignment titled "${assignment.title}".`
      : "Give me a short study hint for my next assignment.";
    queueAssistantPrompt(prompt);
    navigate({ to: "/assistant" });
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
        subtitle={`Student ${studentId} with a smaller workflow that keeps the next action obvious.`}
        actions={
          <>
            <Badge tone="warning">{pending.length} pending</Badge>
            <Badge tone="success">{submitted.length} submitted</Badge>
            <Badge tone="brand">{totalAssignments} items</Badge>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-5">
          <SectionTitle action={<Badge tone="brand">Focus</Badge>} description="A compact summary keeps the queue readable before the student opens any item.">
            Submission rhythm
          </SectionTitle>
          <div className="space-y-3">
            <div className="rounded-2xl border border-border/70 bg-secondary/25 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{pending.length} pending tasks</p>
                  <p className="mt-1 text-sm text-muted-foreground">{submitted.length} already submitted</p>
                </div>
                <Badge tone={pending.length > 0 ? "warning" : "success"}>{pending.length > 0 ? "Needs work" : "All clear"}</Badge>
              </div>
              <div className="mt-4">
                <ProgressBar value={totalAssignments ? Math.round((submitted.length / totalAssignments) * 100) : 0} tone="success" />
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-brand-50/70 px-4 py-3 dark:bg-brand-500/10">
              <p className="text-sm font-semibold text-foreground">Best next move</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Open the first pending task, attach the work, and save the details before starting a second subject.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <PrimaryButton type="button" onClick={openNextTask}>Open next task</PrimaryButton>
              <SecondaryButton type="button" onClick={askForHint}>Ask AI for a hint</SecondaryButton>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle action={<Badge tone="success">Ready</Badge>} description="Use the edit button on any item to add the file name, URL, and notes without leaving the page.">
            Upload details
          </SectionTitle>
          <div className="rounded-2xl border border-border/70 bg-secondary/25 px-4 py-3 text-sm text-muted-foreground">
            Use the edit button on any item to add the file name, URL, and notes without leaving the page.
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle action={<Badge tone="brand">{assignments?.length ?? 0} items</Badge>} description="A single list is easier to scan, easier to edit, and works better on smaller screens.">
          Assignment list
        </SectionTitle>
        <div className="space-y-4">
          {isLoading && Array.from({ length: 3 }).map((_, index) => (
            <div key={`assignment-skeleton-${index}`} className="rounded-2xl border border-border/70 p-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-2 h-3 w-28" />
            </div>
          ))}
          {isError && <p className="text-sm text-danger">Failed to load assignments.</p>}

          {!isLoading && !isError && (assignments ?? []).length === 0 && (
            <EmptyState
              title="No assignments found"
              description="Once assignments are posted, they will appear here with one clear edit action per item."
              icon={FileCheck2}
            />
          )}

          {(assignments ?? []).map((assignment) => {
            const isEditing = editingAssignmentId === assignment.assignment_id;
            const statusTone = assignment.status === "submitted" ? "success" : assignment.status === "graded" ? "brand" : "warning";

            return (
              <div key={assignment.assignment_id} className="rounded-2xl border border-border/70 bg-card p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{assignment.title}</p>
                      <Badge tone={statusTone}>{assignment.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {assignment.subject} • Due {new Date(assignment.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">{assignment.submission_marks ?? 0}/100</Badge>
                    <SecondaryButton type="button" onClick={() => openUploadEditor(assignment)}>
                      {isEditing ? "Editing details" : "Edit details"}
                    </SecondaryButton>
                  </div>
                </div>

                <div className="mt-4">
                  <ProgressBar value={assignment.submission_marks ?? (assignment.status === "submitted" ? 86 : 35)} tone={assignment.status === "submitted" ? "success" : "warning"} />
                </div>

                <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                  <div className="rounded-xl border border-border/70 bg-secondary/25 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">Submitted</p>
                    <p className="mt-1 flex items-center gap-2 text-foreground"><Clock3 className="size-4 text-brand-600" />{assignment.submitted_at ? new Date(assignment.submitted_at).toLocaleDateString() : "Not yet"}</p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-secondary/25 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">Attachment</p>
                    <p className="mt-1 text-foreground">{assignment.attachment_name || "No file attached"}</p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-secondary/25 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">Notes</p>
                    <p className="mt-1 text-foreground">{assignment.submission_notes || "None yet"}</p>
                  </div>
                </div>

                {assignment.attachment_url && (
                  <a
                    href={assignment.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 block text-sm font-medium text-brand-700 hover:underline dark:text-brand-300"
                  >
                    Open attachment
                  </a>
                )}

                {isEditing && (
                  <div className="mt-4 space-y-2 rounded-2xl border border-border/70 bg-secondary/25 p-3">
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
            );
          })}
        </div>
      </Card>
    </div>
  );
}