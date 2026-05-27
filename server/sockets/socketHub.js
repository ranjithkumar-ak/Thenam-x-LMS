import { domainEvents } from "../events/domainEvents.js";

let ioInstance = null;

function joinContextRooms(socket, context = {}) {
  const { role, userId, classId, studentId, teacherId, parentId } = context;

  if (role) {
    socket.join(`role:${role}`);
  }
  if (userId) {
    socket.join(`user:${userId}`);
  }
  if (classId) {
    socket.join(`class:${classId}`);
  }
  if (studentId) {
    socket.join(`student:${studentId}`);
  }
  if (teacherId) {
    socket.join(`teacher:${teacherId}`);
  }
  if (parentId) {
    socket.join(`parent:${parentId}`);
  }
}

function forwardEvent(eventName, payload) {
  if (!ioInstance) {
    return;
  }

  const rooms = new Set();
  const classId = payload?.class_id || payload?.classId;
  const studentId = payload?.student_id || payload?.studentId;
  const teacherId = payload?.teacher_id || payload?.teacherId;
  const parentId = payload?.parent_id || payload?.parentId;
  const userId = payload?.user_id || payload?.userId;
  const role = payload?.role;

  if (Array.isArray(payload?.rooms)) {
    for (const room of payload.rooms) {
      if (typeof room === "string" && room.trim()) {
        rooms.add(room);
      }
    }
  }

  if (typeof payload?.room === "string" && payload.room.trim()) {
    rooms.add(payload.room);
  }

  if (classId) rooms.add(`class:${classId}`);
  if (studentId) rooms.add(`student:${studentId}`);
  if (teacherId) rooms.add(`teacher:${teacherId}`);
  if (parentId) rooms.add(`parent:${parentId}`);
  if (userId) rooms.add(`user:${userId}`);
  if (role) rooms.add(`role:${role}`);

  rooms.add("role:admin");

  const envelope = {
    event: eventName,
    payload,
    timestamp: new Date().toISOString(),
  };

  for (const room of rooms) {
    ioInstance.to(room).emit("domain:event", envelope);
  }

  ioInstance.to("broadcast:admins").emit("domain:event", envelope);
}

export async function initializeSocketHub(httpServer, { corsOrigin } = {}) {
  try {
    const { Server } = await import("socket.io");
    ioInstance = new Server(httpServer, {
      cors: {
        origin: corsOrigin || true,
        credentials: true,
      },
    });
  } catch {
    ioInstance = null;
    return null;
  }

  ioInstance.use((socket, next) => {
    const context = {
      role: socket.handshake.auth?.role || socket.handshake.query?.role,
      userId: socket.handshake.auth?.userId || socket.handshake.query?.userId,
      classId: socket.handshake.auth?.classId || socket.handshake.query?.classId,
      studentId: socket.handshake.auth?.studentId || socket.handshake.query?.studentId,
      teacherId: socket.handshake.auth?.teacherId || socket.handshake.query?.teacherId,
      parentId: socket.handshake.auth?.parentId || socket.handshake.query?.parentId,
    };

    socket.data.context = context;
    next();
  });

  ioInstance.on("connection", (socket) => {
    joinContextRooms(socket, socket.data.context);

    socket.on("room:join", (room) => {
      if (room && typeof room === "string") {
        socket.join(room);
      }
    });

    socket.on("room:leave", (room) => {
      if (room && typeof room === "string") {
        socket.leave(room);
      }
    });

    socket.on("ping", () => {
      socket.emit("pong", { ok: true, timestamp: new Date().toISOString() });
    });
  });

  domainEvents.on("domain-event", ({ eventName, payload }) => {
    forwardEvent(eventName, payload);
  });

  return ioInstance;
}

export function emitRealtimeEvent(eventName, payload) {
  domainEvents.emit("domain-event", {
    eventName,
    payload,
    timestamp: new Date().toISOString(),
  });
}

export function getSocketServer() {
  return ioInstance;
}
