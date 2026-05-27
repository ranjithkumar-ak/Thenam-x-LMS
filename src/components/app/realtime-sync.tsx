import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "./role-context";
import { describeRealtimeEvent, resolveInvalidationKeys, resolveRealtimeAuth, resolveRealtimeUrl, type RealtimeEnvelope } from "@/lib/realtime";

export function RealtimeSync() {
  const queryClient = useQueryClient();
  const { auth } = useAuth();
  const { role } = useRole();

  useEffect(() => {
    const socketUrl = resolveRealtimeUrl();
    if (!socketUrl) return;

    const socket = io(socketUrl, {
      auth: resolveRealtimeAuth(role, auth),
      transports: ["websocket"],
      withCredentials: true,
    });

    const onDomainEvent = (envelope: RealtimeEnvelope) => {
      const keys = resolveInvalidationKeys(envelope);
      for (const key of keys) {
        queryClient.invalidateQueries({ queryKey: key });
      }

      const message = describeRealtimeEvent(envelope);
      toast(message.title, { description: message.description });
    };

    socket.on("domain:event", onDomainEvent);

    return () => {
      socket.off("domain:event", onDomainEvent);
      socket.disconnect();
    };
  }, [auth?.identifier, auth?.role, queryClient, role]);

  return null;
}