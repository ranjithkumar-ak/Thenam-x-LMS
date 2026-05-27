import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FolderUp, FileText, CalendarClock, ClipboardCheck } from "lucide-react";

import {
  useCreateUploadCenterItem,
  useDeleteUploadCenterAttachment,
  useUploadCenterItems,
  useUploadCenterOptions,
  useUpdateUploadCenterItem,
  type UploadCenterCategory,
} from "@/hooks/api-hooks";
import { Card, PageHeader, SectionTitle, Badge, PrimaryButton, SecondaryButton } from "@/components/app/ui-bits";

export const Route = createFileRoute("/admin/uploads")({
  head: () => ({ meta: [{ title: "Upload Module — AetherLMS" }] }),
  component: AdminUploadsPage,
});

type FormState = {
  category: UploadCenterCategory;
  title: string;
  description: string;
  class_id: string;
  subject: string;
  status: "draft" | "published" | "archived";
  due_at: string;
  starts_at: string;
  ends_at: string;
  exam_date: string;
  max_marks: string;
  obtained_marks: string;
  meeting_url: string;
  location: string;
  reminder_minutes: string;
  is_online: boolean;
};

const INITIAL_FORM: FormState = {
  category: "assignment",
  title: "",
  description: "",
  class_id: "",
  subject: "",
  status: "published",
  due_at: "",
  starts_at: "",
  ends_at: "",
  exam_date: "",
  max_marks: "",
  obtained_marks: "",
  meeting_url: "",
  location: "",
  reminder_minutes: "",
  is_online: false,
};

function AdminUploadsPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [files, setFiles] = useState<File[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const { data: moduleOptions } = useUploadCenterOptions();
  const { data: itemData, isLoading } = useUploadCenterItems({ sort: "newest", limit: 30 });
  const createItem = useCreateUploadCenterItem();
  const updateItem = useUpdateUploadCenterItem();
  const deleteAttachment = useDeleteUploadCenterAttachment();

  const records = itemData?.records ?? [];
  const activeOptionKeys = useMemo(() => {
    return moduleOptions?.category_options?.[form.category] ?? [];
  }, [form.category, moduleOptions?.category_options]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetComposer() {
    setForm(INITIAL_FORM);
    setFiles([]);
    setEditingItemId(null);
  }

  function buildOptionsPayload() {
    return {
      due_at: form.due_at || null,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      exam_date: form.exam_date || null,
      max_marks: form.max_marks ? Number(form.max_marks) : null,
      obtained_marks: form.obtained_marks ? Number(form.obtained_marks) : null,
      meeting_url: form.meeting_url || "",
      location: form.location || "",
      reminder_minutes: form.reminder_minutes ? Number(form.reminder_minutes) : null,
      is_online: form.is_online,
    };
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    const input = {
      category: form.category,
      title: form.title,
      description: form.description,
      class_id: form.class_id,
      subject: form.subject,
      status: form.status,
      options: buildOptionsPayload(),
      files,
    };

    if (editingItemId) {
      updateItem.mutate(
        { itemId: editingItemId, input },
        {
          onSuccess: () => resetComposer(),
        },
      );
      return;
    }

    createItem.mutate(input, {
      onSuccess: () => resetComposer(),
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Upload Module"
        subtitle="Create and manage assignments, tests, marks, scheduling, and meetings with structured options and multi-format document attachments."
        actions={
          <>
            <Badge tone="brand">{records.length} records</Badge>
            <Badge tone="success">{moduleOptions?.limits.max_file_size_mb ?? 15}MB/file</Badge>
          </>
        }
      />

      <Card className="p-5">
        <SectionTitle
          action={<Badge tone="brand">Composer</Badge>}
          description="One dedicated module for academic uploads with category-specific options."
        >
          Create or update upload item
        </SectionTitle>

        <form onSubmit={onSubmit} className="grid gap-3 lg:grid-cols-2">
          <select value={form.category} onChange={(event) => setField("category", event.target.value as UploadCenterCategory)} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm">
            {(moduleOptions?.categories ?? ["assignment", "test", "marks", "scheduling", "meeting"]).map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select value={form.status} onChange={(event) => setField("status", event.target.value as FormState["status"])} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm">
            <option value="published">published</option>
            <option value="draft">draft</option>
            <option value="archived">archived</option>
          </select>

          <input value={form.title} onChange={(event) => setField("title", event.target.value)} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm lg:col-span-2" placeholder="Title" required />
          <textarea value={form.description} onChange={(event) => setField("description", event.target.value)} className="min-h-24 rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm lg:col-span-2" placeholder="Description" />

          <input value={form.class_id} onChange={(event) => setField("class_id", event.target.value)} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm" placeholder="Class ID" />
          <input value={form.subject} onChange={(event) => setField("subject", event.target.value)} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm" placeholder="Subject" />

          {activeOptionKeys.includes("due_at") && <input type="datetime-local" value={form.due_at} onChange={(event) => setField("due_at", event.target.value)} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm" />}
          {activeOptionKeys.includes("starts_at") && <input type="datetime-local" value={form.starts_at} onChange={(event) => setField("starts_at", event.target.value)} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm" />}
          {activeOptionKeys.includes("ends_at") && <input type="datetime-local" value={form.ends_at} onChange={(event) => setField("ends_at", event.target.value)} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm" />}
          {activeOptionKeys.includes("exam_date") && <input type="date" value={form.exam_date} onChange={(event) => setField("exam_date", event.target.value)} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm" />}
          {activeOptionKeys.includes("max_marks") && <input type="number" value={form.max_marks} onChange={(event) => setField("max_marks", event.target.value)} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm" placeholder="Max marks" />}
          {activeOptionKeys.includes("obtained_marks") && <input type="number" value={form.obtained_marks} onChange={(event) => setField("obtained_marks", event.target.value)} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm" placeholder="Obtained marks" />}
          {activeOptionKeys.includes("meeting_url") && <input value={form.meeting_url} onChange={(event) => setField("meeting_url", event.target.value)} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm" placeholder="Meeting URL" />}
          {activeOptionKeys.includes("location") && <input value={form.location} onChange={(event) => setField("location", event.target.value)} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm" placeholder="Location" />}
          {activeOptionKeys.includes("reminder_minutes") && <input type="number" value={form.reminder_minutes} onChange={(event) => setField("reminder_minutes", event.target.value)} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm" placeholder="Reminder (minutes)" />}

          <label className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm">
            <input type="checkbox" checked={form.is_online} onChange={(event) => setField("is_online", event.target.checked)} />
            Online session
          </label>

          <div className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm lg:col-span-2">
            <p className="mb-2 font-medium text-foreground">Attachments</p>
            <input
              type="file"
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              className="block w-full text-sm"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Supported: {(moduleOptions?.accepted_extensions ?? []).join(", ") || "pdf, docx, xlsx, pptx, png, jpg, zip, csv, txt"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:col-span-2">
            <PrimaryButton type="submit" disabled={createItem.isPending || updateItem.isPending}>
              <FolderUp className="size-4" />
              {editingItemId ? "Update item" : "Create item"}
            </PrimaryButton>
            <SecondaryButton type="button" onClick={resetComposer}>Reset</SecondaryButton>
          </div>
        </form>
      </Card>

      <Card>
        <SectionTitle action={<Badge tone="success">Library</Badge>} description="Manage uploaded documents and category-specific records from one place.">
          Upload records
        </SectionTitle>
        {isLoading && <p className="text-sm text-muted-foreground">Loading records...</p>}
        <div className="grid gap-4 xl:grid-cols-2">
          {records.map((record) => (
            <Card key={record.item_id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{record.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {record.category} • {record.subject || "no subject"} • {record.class_id || "no class"}
                  </p>
                </div>
                <Badge tone={record.status === "published" ? "success" : record.status === "draft" ? "warning" : "brand"}>{record.status}</Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <SecondaryButton
                  type="button"
                  onClick={() => {
                    setEditingItemId(record.item_id);
                    setForm({
                      category: record.category,
                      title: record.title,
                      description: record.description,
                      class_id: record.class_id,
                      subject: record.subject,
                      status: record.status,
                      due_at: record.options?.due_at ? new Date(record.options.due_at).toISOString().slice(0, 16) : "",
                      starts_at: record.options?.starts_at ? new Date(record.options.starts_at).toISOString().slice(0, 16) : "",
                      ends_at: record.options?.ends_at ? new Date(record.options.ends_at).toISOString().slice(0, 16) : "",
                      exam_date: record.options?.exam_date ? new Date(record.options.exam_date).toISOString().slice(0, 10) : "",
                      max_marks: record.options?.max_marks != null ? String(record.options.max_marks) : "",
                      obtained_marks: record.options?.obtained_marks != null ? String(record.options.obtained_marks) : "",
                      meeting_url: record.options?.meeting_url ?? "",
                      location: record.options?.location ?? "",
                      reminder_minutes: record.options?.reminder_minutes != null ? String(record.options.reminder_minutes) : "",
                      is_online: Boolean(record.options?.is_online),
                    });
                    setFiles([]);
                  }}
                >
                  <ClipboardCheck className="size-4" />Edit
                </SecondaryButton>
              </div>

              <div className="mt-4 space-y-2">
                {(record.attachments ?? []).map((attachment) => (
                  <div key={attachment.file_id} className="flex items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2">
                    <a href={attachment.download_url} className="min-w-0 truncate text-xs font-medium text-brand-700 hover:underline dark:text-brand-300">
                      <FileText className="mr-1 inline size-3" />
                      {attachment.original_name}
                    </a>
                    <SecondaryButton
                      type="button"
                      onClick={() => deleteAttachment.mutate({ itemId: record.item_id, fileId: attachment.file_id })}
                    >
                      Remove
                    </SecondaryButton>
                  </div>
                ))}
                {(record.attachments ?? []).length === 0 && <p className="text-xs text-muted-foreground">No attachments uploaded yet.</p>}
              </div>

              <div className="mt-4 rounded-2xl border border-border/70 bg-secondary/25 px-3 py-2 text-xs text-muted-foreground">
                <CalendarClock className="mr-1 inline size-3" />
                Updated {new Date(record.updatedAt).toLocaleString()}
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
