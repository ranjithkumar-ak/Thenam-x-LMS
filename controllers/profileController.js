import { AppError } from "../utils/appError.js";
import { ok } from "../utils/apiResponse.js";
import { Profile } from "../models/Profile.js";
import { publishDomainEvent } from "../server/events/domainEvents.js";

const PROFILE_PRESETS = {
  admin: {
    display_name: "Sarah Chen",
    subtitle: "Principal Admin",
    email: "sarah.chen@aetherlms.edu",
    phone: "+1 (555) 210-0190",
    location: "Main Administration Office",
    bio: "Oversees operations, academic performance, and school-wide support for staff, families, and students.",
    default_landing: "/admin",
    theme: "dark",
    accent: "brand",
  },
  teacher: {
    display_name: "Mr. Daniel Lee",
    subtitle: "Physics, Grade 12",
    email: "daniel.lee@aetherlms.edu",
    phone: "+1 (555) 210-0191",
    location: "Science Block",
    bio: "Focuses on practical classroom flow, fast feedback, and meaningful lesson interventions.",
    default_landing: "/teacher",
    theme: "system",
    accent: "emerald",
  },
  student: {
    display_name: "Aria Patel",
    subtitle: "Grade 11-A",
    email: "aria.patel@student.aetherlms.edu",
    phone: "+1 (555) 210-0192",
    location: "Grade 11 Campus",
    bio: "Uses the LMS to track tasks, revision, and AI tutoring across every subject.",
    default_landing: "/student",
    theme: "light",
    accent: "amber",
  },
  parent: {
    display_name: "Mrs. Patel",
    subtitle: "Parent of Aria",
    email: "patel.family@aetherlms.edu",
    phone: "+1 (555) 210-0193",
    location: "Family Portal",
    bio: "Keeps a calm eye on attendance, communication, and school progress.",
    default_landing: "/parent",
    theme: "light",
    accent: "brand",
  },
  accounts: {
    display_name: "Jonas Müller",
    subtitle: "Finance Officer",
    email: "jonas.muller@aetherlms.edu",
    phone: "+1 (555) 210-0194",
    location: "Finance Office",
    bio: "Manages collections, reconciliation, payment follow-ups, and audit-friendly reporting.",
    default_landing: "/accounts",
    theme: "system",
    accent: "rose",
  },
};

function buildDefaultProfile(role) {
  const preset = PROFILE_PRESETS[role];
  if (!preset) {
    throw new AppError(`Unsupported profile role: ${role}`, 400);
  }

  return {
    role,
    display_name: preset.display_name,
    subtitle: preset.subtitle,
    email: preset.email,
    phone: preset.phone,
    location: preset.location,
    bio: preset.bio,
    theme: preset.theme,
    accent: preset.accent,
    density: "comfortable",
    default_landing: preset.default_landing,
    compact_sidebar: false,
    keyboard_shortcuts: true,
    email_notifications: true,
    sms_notifications: false,
    weekly_digest: true,
    recent_activity: [
      { title: "Profile loaded", detail: `Loaded the ${preset.subtitle} workspace profile.`, tone: "brand" },
      { title: "Notifications enabled", detail: "Email summaries and activity notifications are active.", tone: "success" },
      { title: "Workspace ready", detail: "Saved preferences will sync across the profile page.", tone: "neutral" },
    ],
  };
}

async function getOrCreateProfile(role) {
  const existing = await Profile.findOne({ role });
  if (existing) {
    return existing;
  }

  return Profile.create(buildDefaultProfile(role));
}

function appendActivity(profile, title, detail, tone = "brand") {
  profile.recent_activity = [
    { title, detail, tone, at: new Date() },
    ...(profile.recent_activity ?? []).slice(0, 7),
  ];
}

export async function getProfile(req, res) {
  const profile = await getOrCreateProfile(req.params.role);
  return ok(res, profile);
}

export async function updateProfile(req, res) {
  const profile = await getOrCreateProfile(req.params.role);
  const updates = req.body ?? {};
  const previous = profile.toObject();

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;
    profile[key] = value;
  }

  const changedFields = Object.keys(updates).filter((key) => updates[key] !== undefined);
  if (changedFields.length > 0) {
    appendActivity(
      profile,
      "Profile updated",
      `Updated ${changedFields.slice(0, 3).join(", ")} for ${profile.display_name}.`,
      "success",
    );
  }

  await profile.save();
  publishDomainEvent("profile.updated", {
    resource: "profile",
    action: "updated",
    role: profile.role,
    rooms: ["role:admin", `role:${profile.role}`],
    profile: profile.toObject(),
  });
  return ok(res, profile, undefined, "Profile saved successfully.");
}

export async function getProfileActivity(req, res) {
  const profile = await getOrCreateProfile(req.params.role);
  return ok(res, profile.recent_activity ?? []);
}
