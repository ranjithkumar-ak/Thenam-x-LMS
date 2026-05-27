import type { QueryKey } from "@tanstack/react-query";
import { getAuth, type AuthState } from "./auth";
import type { Role } from "@/components/app/role-context";

export type RealtimeEnvelope = {
  event: string;
  payload?: {
    resource?: string;
    action?: string;
    rooms?: string[];
    [key: string]: unknown;
  };
  timestamp?: string;
};

const RESOURCE_QUERY_KEYS: Record<string, QueryKey[]> = {
  students: [["students"]],
  teachers: [["teachers"]],
  attendance: [["attendance"], ["analytics"]],
  marks: [["marks"], ["analytics"]],
  assignments: [["assignments"], ["analytics"]],
  fees: [["fees"], ["payments"], ["analytics"]],
  payments: [["fees"], ["payments"], ["analytics"]],
  timetable: [["timetable"]],
  notifications: [["notifications"]],
  profile: [["profile"]],
  analytics: [["analytics"]],
};

const RESOURCE_LABELS: Record<string, string> = {
  students: "Students",
  teachers: "Teachers",
  attendance: "Attendance",
  marks: "Marks",
  assignments: "Assignments",
  fees: "Fees",
  payments: "Payments",
  timetable: "Timetable",
  notifications: "Notifications",
  profile: "Profile",
  analytics: "Analytics",
  ai: "AI assistant",
};

function normalizeResource(resource: string | undefined, eventName: string) {
  const base = resource?.trim().toLowerCase() || eventName.split(".")[0]?.toLowerCase() || "";
  if (!base) return "";
  if (base === "assignment") return "assignments";
  if (base === "payment") return "payments";
  if (base === "notification") return "notifications";
  return base;
}

export function resolveRealtimeUrl() {
  if (typeof window === "undefined") return "";

  const configured = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || "";
  if (!configured || configured === "/api") {
    return window.location.origin;
  }

  return configured.replace(/\/api\/?$/, "").replace(/\/$/, "");
}

export function resolveRealtimeAuth(role: Role, auth: AuthState | null) {
  const activeRole = auth?.role ?? role;
  const identifier = auth?.identifier;

  if (!identifier) {
    return { role: activeRole };
  }

  if (activeRole === "student") {
    return { role: activeRole, userId: identifier, studentId: identifier };
  }

  if (activeRole === "teacher") {
    return { role: activeRole, userId: identifier, teacherId: identifier };
  }

  if (activeRole === "parent") {
    return { role: activeRole, userId: identifier, parentId: identifier };
  }

  return { role: activeRole, userId: identifier };
}

export function resolveInvalidationKeys(envelope: RealtimeEnvelope) {
  const resource = normalizeResource(envelope.payload?.resource as string | undefined, envelope.event);
  return RESOURCE_QUERY_KEYS[resource] ?? (resource ? ([[resource]] as QueryKey[]) : []);
}

export function describeRealtimeEvent(envelope: RealtimeEnvelope) {
  const resource = normalizeResource(envelope.payload?.resource as string | undefined, envelope.event);
  const label = RESOURCE_LABELS[resource] ?? (resource || "Campus");
  const action = String(envelope.payload?.action ?? envelope.event.split(".").at(-1) ?? "updated");

  return {
    title: `${label} ${action}`,
    description: `Live ${label.toLowerCase()} data has been refreshed.`,
  };
}