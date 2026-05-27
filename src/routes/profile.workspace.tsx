import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { LogOut, Settings2, ShieldCheck } from "lucide-react";
import { Badge, Card, PageHeader, PrimaryButton, SecondaryButton, SectionTitle } from "@/components/app/ui-bits";
import { useRole } from "@/components/app/role-context";
import { useProfile, useUpdateProfile } from "@/hooks/api-hooks";
import { logout } from "@/lib/auth";

export const Route = createFileRoute("/profile/workspace")({
  head: () => ({ meta: [{ title: "Workspace Settings — AetherLMS" }] }),
  component: WorkspaceSettingsPage,
});

type WorkspaceFormState = {
  theme: "light" | "dark" | "system";
  accent: "brand" | "emerald" | "amber" | "rose";
  density: "comfortable" | "compact";
  default_landing: string;
  compact_sidebar: boolean;
  keyboard_shortcuts: boolean;
};

function WorkspaceSettingsPage() {
  const navigate = useNavigate();
  const { role, current } = useRole();
  const { data: profile, isLoading } = useProfile(role);
  const updateProfile = useUpdateProfile(role);
  const avatarUrl = profile?.avatar_url ?? "";

  const initialState = useMemo<WorkspaceFormState>(
    () => ({
      theme: profile?.theme ?? "system",
      accent: profile?.accent ?? "brand",
      density: profile?.density ?? "comfortable",
      default_landing: profile?.default_landing ?? `/${role}`,
      compact_sidebar: profile?.compact_sidebar ?? false,
      keyboard_shortcuts: profile?.keyboard_shortcuts ?? true,
    }),
    [profile, role],
  );

  const [form, setForm] = useState<WorkspaceFormState>(initialState);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setForm(initialState);
    setDirty(false);
  }, [initialState]);

  function updateField<K extends keyof WorkspaceFormState>(key: K, value: WorkspaceFormState[K]) {
    setForm((currentForm) => ({ ...currentForm, [key]: value }));
    setDirty(true);
  }

  async function saveProfile() {
    await updateProfile.mutateAsync(form);
    setDirty(false);
  }

  function signOut() {
    logout();
    navigate({ to: "/" });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace center"
        title="Workspace Settings"
        subtitle="Set the theme, accent, density, sidebar style, and default landing page for this account."
        actions={
          <>
            {isLoading && <Badge tone="warning">Loading profile</Badge>}
            <Badge tone="brand"><ShieldCheck className="mr-1 inline size-3" />Saved securely</Badge>
            <PrimaryButton onClick={saveProfile} disabled={updateProfile.isPending || !dirty}>
              {updateProfile.isPending ? "Saving..." : "Save changes"}
            </PrimaryButton>
            <SecondaryButton onClick={signOut}><LogOut className="size-4" />Sign out</SecondaryButton>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="p-5">
          <SectionTitle action={<Badge tone="brand">Layout</Badge>} description="These options define the way the workspace looks and feels.">
            Interface preferences
          </SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Theme</span>
              <select value={form.theme} onChange={(event) => updateField("theme", event.target.value as WorkspaceFormState["theme"])} className="w-full rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm">
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Accent</span>
              <select value={form.accent} onChange={(event) => updateField("accent", event.target.value as WorkspaceFormState["accent"])} className="w-full rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm">
                <option value="brand">Brand</option>
                <option value="emerald">Emerald</option>
                <option value="amber">Amber</option>
                <option value="rose">Rose</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Density</span>
              <select value={form.density} onChange={(event) => updateField("density", event.target.value as WorkspaceFormState["density"])} className="w-full rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm">
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Default landing</span>
              <select value={form.default_landing} onChange={(event) => updateField("default_landing", event.target.value)} className="w-full rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm">
                <option value="/admin">Admin</option>
                <option value="/teacher">Teacher</option>
                <option value="/student">Student</option>
                <option value="/parent">Parent</option>
                <option value="/accounts">Accounts</option>
              </select>
            </label>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle action={<Badge tone="success">Navigation</Badge>} description="Choose how the workspace behaves when this account opens.">
            Sidebar and shortcuts
          </SectionTitle>
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border/70 bg-secondary/25 p-4">
            <div className="flex size-14 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-brand-foreground">
              {avatarUrl ? <img src={avatarUrl} alt={current.person} className="h-full w-full object-cover" /> : current.person.slice(0, 1)}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{current.person}</p>
              <p className="text-xs text-muted-foreground">Avatar and workspace settings stay in sync with the profile page.</p>
            </div>
          </div>
          <div className="space-y-3 rounded-2xl border border-border/70 bg-secondary/25 p-4 text-sm">
            {[
              ["compact_sidebar", "Compact sidebar"],
              ["keyboard_shortcuts", "Keyboard shortcuts"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-4">
                <span className="text-foreground">{label}</span>
                <input type="checkbox" checked={form[key as keyof WorkspaceFormState] as boolean} onChange={(event) => updateField(key as keyof WorkspaceFormState, event.target.checked as never)} className="size-4 rounded border-border/70" />
              </label>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-border/70 bg-brand-50/70 p-4 dark:bg-brand-500/10">
            <p className="text-sm font-semibold text-foreground">Current account</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{current.person} • {current.subtitle}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
