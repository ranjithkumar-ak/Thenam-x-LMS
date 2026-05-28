import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Camera, LogOut, ShieldCheck, Trash2, Upload, UserCircle2 } from "lucide-react";
import { Badge, Card, PageHeader, PrimaryButton, SecondaryButton, SectionTitle } from "@/components/app/ui-bits";
import { useRole } from "@/components/app/role-context";
import { useProfile, useUpdateProfile } from "@/hooks/api-hooks";
import { logout } from "@/lib/auth";

export const Route = createFileRoute("/profile/account")({
  head: () => ({ meta: [{ title: "Account Profile — AetherLMS" }] }),
  component: AccountProfilePage,
});

type AccountFormState = {
  display_name: string;
  subtitle: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  avatar_url: string;
};

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });
}

function AccountProfilePage() {
  const navigate = useNavigate();
  const { role, current } = useRole();
  const { data: profile, isLoading } = useProfile(role);
  const updateProfile = useUpdateProfile(role);

  const initialState = useMemo<AccountFormState>(
    () => ({
      display_name: profile?.display_name ?? current.person,
      subtitle: profile?.subtitle ?? current.subtitle,
      email: profile?.email ?? "",
      phone: profile?.phone ?? "",
      location: profile?.location ?? "",
      bio: profile?.bio ?? "",
      avatar_url: profile?.avatar_url ?? "",
    }),
    [current.person, current.subtitle, profile],
  );

  const [form, setForm] = useState<AccountFormState>(initialState);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setForm(initialState);
    setDirty(false);
  }, [initialState]);

  function updateField<K extends keyof AccountFormState>(key: K, value: AccountFormState[K]) {
    setForm((currentForm) => ({ ...currentForm, [key]: value }));
    setDirty(true);
  }

  async function updateAvatar(file?: File | null) {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    updateField("avatar_url", dataUrl);
  }

  async function saveProfile() {
    await updateProfile.mutateAsync({
      ...form,
      avatar_url: form.avatar_url.trim(),
    });
    setDirty(false);
  }

  function signOut() {
    logout();
    navigate({ to: "/" });
  }

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <div className="relative">
            <div className="flex size-28 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-gradient-to-br from-brand-500 to-brand-700 text-3xl font-bold text-brand-foreground shadow-[0_28px_50px_-26px_rgba(79,70,229,0.9)]">
              {form.avatar_url ? (
                <img src={form.avatar_url} alt={form.display_name} className="h-full w-full object-cover" />
              ) : (
                <UserCircle2 className="size-14" />
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground shadow-lg transition hover:border-brand-300 hover:text-foreground">
              <Upload className="size-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => void updateAvatar(event.target.files?.[0])}
              />
            </label>
          </div>

          <div className="mt-5 space-y-2">
            <p className="text-2xl font-bold tracking-tight text-foreground">{form.display_name}</p>
            <p className="text-sm text-muted-foreground">{form.subtitle}</p>
            <p className="text-sm text-muted-foreground">Upload a photo once and it will appear in the navbar and profile screens after saving.</p>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <PrimaryButton
              type="button"
              onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
            >
              <Camera className="size-4" />
              Change photo
            </PrimaryButton>
            <SecondaryButton
              type="button"
              onClick={() => updateField("avatar_url", "")}
              disabled={!form.avatar_url}
            >
              <Trash2 className="size-4" />
              Remove photo
            </SecondaryButton>
          </div>
        </div>
      </Card>

      <PageHeader
        eyebrow="Account center"
        title="Account Profile"
        subtitle="Update the details that appear across the platform for staff, parents, and students."
        actions={
          <>
            {isLoading && <Badge tone="warning">Loading profile</Badge>}
            <Badge tone="brand"><ShieldCheck className="mr-1 inline size-3" />Profile saved securely</Badge>
            <PrimaryButton onClick={saveProfile} disabled={updateProfile.isPending || !dirty}>
              {updateProfile.isPending ? "Saving..." : "Save changes"}
            </PrimaryButton>
            <SecondaryButton onClick={signOut}><LogOut className="size-4" />Sign out</SecondaryButton>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5">
          <SectionTitle action={<Badge tone="brand">Profile</Badge>} description="Keep the visible identity details consistent across the LMS.">
            Personal details
          </SectionTitle>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-1">
              <span className="text-sm font-medium text-foreground">Display name</span>
              <input value={form.display_name} onChange={(event) => updateField("display_name", event.target.value)} className="w-full rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm" />
            </label>
            <label className="space-y-2 md:col-span-1">
              <span className="text-sm font-medium text-foreground">Role subtitle</span>
              <input value={form.subtitle} onChange={(event) => updateField("subtitle", event.target.value)} className="w-full rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm" />
            </label>
            <label className="space-y-2 md:col-span-1">
              <span className="text-sm font-medium text-foreground">Email</span>
              <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} className="w-full rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm" />
            </label>
            <label className="space-y-2 md:col-span-1">
              <span className="text-sm font-medium text-foreground">Phone</span>
              <input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} className="w-full rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm" />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Location</span>
              <input value={form.location} onChange={(event) => updateField("location", event.target.value)} className="w-full rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm" />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Bio</span>
              <textarea value={form.bio} onChange={(event) => updateField("bio", event.target.value)} rows={4} className="w-full rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm" />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Photo URL</span>
              <input
                value={form.avatar_url}
                onChange={(event) => updateField("avatar_url", event.target.value)}
                className="w-full rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm"
                placeholder="Uploaded photo preview is saved here"
              />
            </label>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle action={<Badge tone="success">Summary</Badge>} description="The current profile preview used by the rest of the platform.">
            Profile summary
          </SectionTitle>
          <div className="space-y-3 text-center">
            <div className="flex justify-center">
              <div className="flex size-20 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-card shadow-sm">
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt={form.display_name} className="h-full w-full object-cover" />
                ) : (
                  <UserCircle2 className="size-10 text-muted-foreground" />
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4 text-left">
              <p className="text-sm font-semibold text-foreground">Current user</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{form.display_name}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4 text-left">
              <p className="text-sm font-semibold text-foreground">Account role</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{role}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-brand-50/70 p-4 text-left dark:bg-brand-500/10">
              <p className="text-sm font-semibold text-foreground">Next step</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Use Workspace Settings to control layout, theme, and landing page preferences.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
