import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, ClipboardCheck, Download, Eye, FileText, FolderUp, Paperclip, Search, SlidersHorizontal } from "lucide-react";

import {
  useCreateUploadCenterItem,
  useDeleteUploadCenterAttachment,
  useUploadCenterItems,
  useUploadCenterOptions,
  useUpdateUploadCenterItem,
  type UploadCenterCategory,
  type UploadCenterStatus,
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
  student_id: string;
  teacher_id: string;
  created_by: string;
  status: UploadCenterStatus;
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

type FilterState = {
  category: UploadCenterCategory | "all";
  status: UploadCenterStatus | "all";
  q: string;
  class_id: string;
};

const INITIAL_FORM: FormState = {
  category: "assignment",
  title: "",
  description: "",
  class_id: "",
  subject: "",
  student_id: "",
  teacher_id: "",
  created_by: "",
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

const INITIAL_FILTERS: FilterState = {
  category: "all",
  status: "all",
  q: "",
  class_id: "",
};

function formatDate(value?: string | Date | null) {
  if (!value) return "Not set";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString();
}

function formatValue(value?: string | number | boolean | null) {
  if (value === null || value === undefined || value === "") return "Not set";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function AdminUploadsPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [files, setFiles] = useState<File[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  const { data: moduleOptions } = useUploadCenterOptions();
  const queryFilters = useMemo(
    () => ({
      sort: "updated" as const,
      limit: 40,
      category: filters.category === "all" ? undefined : filters.category,
      status: filters.status === "all" ? undefined : filters.status,
      q: filters.q.trim() || undefined,
      class_id: filters.class_id.trim() || undefined,
    }),
    [filters],
  );
  const { data: itemData, isLoading } = useUploadCenterItems(queryFilters);
  const createItem = useCreateUploadCenterItem();
  const updateItem = useUpdateUploadCenterItem();
  const deleteAttachment = useDeleteUploadCenterAttachment();

  const records = itemData?.records ?? [];
  const selectedRecord = useMemo(
    () => records.find((record) => record.item_id === selectedItemId) ?? records[0] ?? null,
    [records, selectedItemId],
  );
  const activeOptionKeys = useMemo(() => moduleOptions?.category_options?.[form.category] ?? [], [form.category, moduleOptions?.category_options]);
  const attachmentCount = useMemo(() => records.reduce((sum, record) => sum + (record.attachments?.length ?? 0), 0), [records]);
  const publishedCount = records.filter((record) => record.status === "published").length;
  const draftCount = records.filter((record) => record.status === "draft").length;

  useEffect(() => {
    if (!records.length) {
      setSelectedItemId(null);
      return;
    }

    const selectedStillExists = selectedItemId && records.some((record) => record.item_id === selectedItemId);
    if (!selectedStillExists) {
      setSelectedItemId(records[0].item_id);
    }
  }, [records, selectedItemId]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetComposer() {
    setForm(INITIAL_FORM);
    setFiles([]);
    setEditingItemId(null);
  }

  function loadRecord(record = selectedRecord) {
    if (!record) return;

    setEditingItemId(record.item_id);
    setSelectedItemId(record.item_id);
    setForm({
      category: record.category,
      title: record.title,
      description: record.description,
      class_id: record.class_id,
      subject: record.subject,
      student_id: record.student_id ?? "",
      teacher_id: record.teacher_id ?? "",
      created_by: record.created_by ?? "",
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
      student_id: form.student_id,
      teacher_id: form.teacher_id,
      created_by: form.created_by,
      status: form.status,
      options: buildOptionsPayload(),
      files,
    };

    if (editingItemId) {
      updateItem.mutate(
        { itemId: editingItemId, input },
        { onSuccess: () => resetComposer() },
      );
      return;
    }

    createItem.mutate(input, {
      onSuccess: () => resetComposer(),
    });
  }

  const selectedOptions = selectedRecord?.options ?? null;

  const recordDetails = selectedRecord
    ? [
        { label: "Class", value: selectedRecord.class_id },
        { label: "Subject", value: selectedRecord.subject },
        { label: "Student", value: selectedRecord.student_id },
        { label: "Teacher", value: selectedRecord.teacher_id },
        { label: "Created by", value: selectedRecord.created_by },
        { label: "Status", value: selectedRecord.status },
      ]
    : [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Upload Module"
        subtitle="Create and manage assignments, tests, marks, scheduling, and meetings with structured options and multi-format document attachments."
        actions={
          <>
            <Badge tone="brand">{itemData?.meta?.total ?? records.length} records</Badge>
            <Badge tone="success">{attachmentCount} attachments</Badge>
            <Badge tone="success">{moduleOptions?.limits.max_file_size_mb ?? 15}MB/file</Badge>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Published</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{publishedCount}</p>
          <p className="mt-2 text-sm text-muted-foreground">Visible to users.</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Drafts</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{draftCount}</p>
          <p className="mt-2 text-sm text-muted-foreground">Save work before publishing.</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Attachments</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{attachmentCount}</p>
          <p className="mt-2 text-sm text-muted-foreground">Documents synced through the db-backed module.</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Selected</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{selectedRecord?.title ? "Open" : "None"}</p>
          <p className="mt-2 text-sm text-muted-foreground">Inspect a record in the view panel.</p>
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle action={<Badge tone="brand">Filter</Badge>} description="Quickly find a record before editing or reviewing files.">
          Search records
        </SectionTitle>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Search</span>
            <input
              value={filters.q}
              onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
              className="w-full bg-transparent outline-none"
              placeholder="Title, subject, or notes"
            />
          </label>
          <label className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Category</span>
            <select
              value={filters.category}
              onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value as FilterState["category"] }))}
              className="w-full bg-transparent outline-none"
            >
              <option value="all">All categories</option>
              {(moduleOptions?.categories ?? ["assignment", "test", "marks", "scheduling", "meeting"]).map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Status</span>
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as FilterState["status"] }))}
              className="w-full bg-transparent outline-none"
            >
              <option value="all">All statuses</option>
              <option value="published">published</option>
              <option value="draft">draft</option>
              <option value="archived">archived</option>
            </select>
          </label>
          <label className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Class</span>
            <input
              value={filters.class_id}
              onChange={(event) => setFilters((current) => ({ ...current, class_id: event.target.value }))}
              className="w-full bg-transparent outline-none"
              placeholder="C1A"
            />
          </label>
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle action={<Badge tone="brand">Composer</Badge>} description="One dedicated module for academic uploads with category-specific options.">
          Create or update upload item
        </SectionTitle>

        <form onSubmit={onSubmit} className="grid gap-3 lg:grid-cols-2">
          <select value={form.category} onChange={(event) => setField("category", event.target.value as UploadCenterCategory)} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm">
            {(moduleOptions?.categories ?? ["assignment", "test", "marks", "scheduling", "meeting"]).map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select value={form.status} onChange={(event) => setField("status", event.target.value as UploadCenterStatus)} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm">
            <option value="published">published</option>
            <option value="draft">draft</option>
            <option value="archived">archived</option>
          </select>

          <input value={form.title} onChange={(event) => setField("title", event.target.value)} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm lg:col-span-2" placeholder="Title" required />
          <textarea value={form.description} onChange={(event) => setField("description", event.target.value)} className="min-h-24 rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm lg:col-span-2" placeholder="Description" />

          <input value={form.class_id} onChange={(event) => setField("class_id", event.target.value)} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm" placeholder="Class ID" />
          <input value={form.subject} onChange={(event) => setField("subject", event.target.value)} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm" placeholder="Subject" />
          <input value={form.student_id} onChange={(event) => setField("student_id", event.target.value)} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm" placeholder="Student ID (optional)" />
          <input value={form.teacher_id} onChange={(event) => setField("teacher_id", event.target.value)} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm" placeholder="Teacher ID (optional)" />
          <input value={form.created_by} onChange={(event) => setField("created_by", event.target.value)} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm lg:col-span-2" placeholder="Created by (optional)" />

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
            <input type="file" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} className="block w-full text-sm" />
            <p className="mt-2 text-xs text-muted-foreground">Supported: {(moduleOptions?.accepted_extensions ?? []).join(", ") || "pdf, docx, xlsx, pptx, png, jpg, zip, csv, txt"}</p>
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

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card>
          <SectionTitle action={<Badge tone="success">Library</Badge>} description="Select a record to view details, attachments, and sync metadata.">
            Upload records
          </SectionTitle>
          {isLoading && <p className="text-sm text-muted-foreground">Loading records...</p>}
          <div className="space-y-3">
            {records.map((record) => {
              const isSelected = record.item_id === selectedRecord?.item_id;
              return (
                <button
                  key={record.item_id}
                  type="button"
                  onClick={() => setSelectedItemId(record.item_id)}
                  className={`w-full rounded-3xl border p-4 text-left transition ${isSelected ? "border-brand-300 bg-brand-50/60 dark:border-brand-400/20 dark:bg-brand-500/10" : "border-border/70 bg-card hover:border-brand-200"}`}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{record.title}</p>
                        <Badge tone={record.status === "published" ? "success" : record.status === "draft" ? "warning" : "brand"}>{record.status}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{record.category} • {record.subject || "no subject"} • {record.class_id || "no class"}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="neutral">{record.attachments?.length ?? 0} files</Badge>
                      <SecondaryButton type="button" onClick={(event) => { event.stopPropagation(); loadRecord(record); }}>
                        <ClipboardCheck className="size-4" /> Edit
                      </SecondaryButton>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border/70 bg-secondary/25 px-3 py-2 text-xs text-muted-foreground">
                      <p className="font-semibold uppercase tracking-[0.18em]">Class</p>
                      <p className="mt-1 text-foreground">{record.class_id || "Not set"}</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-secondary/25 px-3 py-2 text-xs text-muted-foreground">
                      <p className="font-semibold uppercase tracking-[0.18em]">Subject</p>
                      <p className="mt-1 text-foreground">{record.subject || "Not set"}</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-secondary/25 px-3 py-2 text-xs text-muted-foreground">
                      <p className="font-semibold uppercase tracking-[0.18em]">Updated</p>
                      <p className="mt-1 text-foreground">{formatDate(record.updatedAt)}</p>
                    </div>
                  </div>
                </button>
              );
            })}

            {!isLoading && records.length === 0 && (
              <div className="rounded-3xl border border-dashed border-border/70 bg-secondary/20 p-6 text-sm text-muted-foreground">
                No records found. Use the composer above to create the first item.
              </div>
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle action={<Badge tone="brand">Inspector</Badge>} description="View one record at a time with its options and files.">
            Selected record
          </SectionTitle>

          {selectedRecord ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-foreground">{selectedRecord.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedRecord.category} • {selectedRecord.class_id || "No class"}</p>
                </div>
                <Badge tone={selectedRecord.status === "published" ? "success" : selectedRecord.status === "draft" ? "warning" : "brand"}>{selectedRecord.status}</Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {recordDetails.map((row) => (
                  <div key={row.label} className="rounded-2xl border border-border/70 bg-secondary/25 px-4 py-3 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{row.label}</p>
                    <p className="mt-1 text-foreground">{formatValue(row.value)}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
                <p className="text-sm font-semibold text-foreground">Description</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{selectedRecord.description || "No description added."}</p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <SlidersHorizontal className="size-4 text-brand-600" />
                  Category options
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {selectedOptions ? (
                    <>
                      <div className="rounded-xl border border-border/70 bg-card px-3 py-2 text-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Timing</p>
                        <p className="mt-1 text-foreground">{formatDate(selectedOptions.starts_at)} → {formatDate(selectedOptions.ends_at)}</p>
                      </div>
                      <div className="rounded-xl border border-border/70 bg-card px-3 py-2 text-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Due / exam</p>
                        <p className="mt-1 text-foreground">{formatDate(selectedOptions.due_at || selectedOptions.exam_date)}</p>
                      </div>
                      {selectedOptions.max_marks != null && (
                        <div className="rounded-xl border border-border/70 bg-card px-3 py-2 text-sm">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Marks</p>
                          <p className="mt-1 text-foreground">{selectedOptions.obtained_marks ?? "-"} / {selectedOptions.max_marks}</p>
                        </div>
                      )}
                      {selectedOptions.meeting_url && (
                        <div className="rounded-xl border border-border/70 bg-card px-3 py-2 text-sm sm:col-span-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Meeting URL</p>
                          <a href={selectedOptions.meeting_url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-foreground underline decoration-dotted underline-offset-4">{selectedOptions.meeting_url}</a>
                        </div>
                      )}
                      {selectedOptions.location && (
                        <div className="rounded-xl border border-border/70 bg-card px-3 py-2 text-sm">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Location</p>
                          <p className="mt-1 text-foreground">{selectedOptions.location}</p>
                        </div>
                      )}
                      {selectedOptions.reminder_minutes != null && (
                        <div className="rounded-xl border border-border/70 bg-card px-3 py-2 text-sm">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Reminder</p>
                          <p className="mt-1 text-foreground">{selectedOptions.reminder_minutes} minutes</p>
                        </div>
                      )}
                      <div className="rounded-xl border border-border/70 bg-card px-3 py-2 text-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Online</p>
                        <p className="mt-1 text-foreground">{selectedOptions.is_online ? "Yes" : "No"}</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No structured options were saved with this record.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Paperclip className="size-4 text-brand-600" />
                  Attachments
                </div>
                <div className="space-y-2">
                  {(selectedRecord.attachments ?? []).map((attachment) => (
                    <div key={attachment.file_id} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-3 py-2 text-sm">
                      <a href={attachment.download_url} className="min-w-0 truncate font-medium text-brand-700 hover:underline dark:text-brand-300">
                        <Download className="mr-1 inline size-3" />
                        {attachment.original_name}
                      </a>
                      <SecondaryButton type="button" onClick={() => deleteAttachment.mutate({ itemId: selectedRecord.item_id, fileId: attachment.file_id })}>
                        Remove
                      </SecondaryButton>
                    </div>
                  ))}
                  {(selectedRecord.attachments ?? []).length === 0 && <p className="text-sm text-muted-foreground">No attachments uploaded yet.</p>}
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-brand-50/70 px-4 py-3 text-sm dark:bg-brand-500/10">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Eye className="size-4 text-brand-600" />
                  DB sync status
                </div>
                <p className="mt-2 text-muted-foreground">Created {formatDate(selectedRecord.createdAt)} • Updated {formatDate(selectedRecord.updatedAt)}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <PrimaryButton type="button" onClick={() => loadRecord(selectedRecord)}>
                  <ClipboardCheck className="size-4" /> Edit selected
                </PrimaryButton>
                <SecondaryButton type="button" onClick={() => setSelectedItemId(records[0]?.item_id ?? null)}>
                  <Search className="size-4" /> Reset view
                </SecondaryButton>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border/70 bg-secondary/20 p-6 text-sm text-muted-foreground">
              No record selected. Create a record above or choose one from the library.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
