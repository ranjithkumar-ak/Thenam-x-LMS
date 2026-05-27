import express from "express";

import aiRoutes from "./aiRoutes.js";
import analyticsRoutes from "./analyticsRoutes.js";
import assignmentRoutes from "./assignmentRoutes.js";
import attendanceRoutes from "./attendanceRoutes.js";
import feesRoutes from "./feesRoutes.js";
import marksRoutes from "./marksRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import parentRoutes from "./parentRoutes.js";
import profileRoutes from "./profileRoutes.js";
import studentRoutes from "./studentRoutes.js";
import teacherRoutes from "./teacherRoutes.js";
import timetableRoutes from "./timetableRoutes.js";
import uploadCenterRoutes from "./uploadCenterRoutes.js";

const apiRouter = express.Router();

apiRouter.use("/students", studentRoutes);
apiRouter.use("/teachers", teacherRoutes);
apiRouter.use("/attendance", attendanceRoutes);
apiRouter.use("/marks", marksRoutes);
apiRouter.use("/assignments", assignmentRoutes);
apiRouter.use("/fees", feesRoutes);
apiRouter.use("/payments", paymentRoutes);
apiRouter.use("/parents", parentRoutes);
apiRouter.use("/profile", profileRoutes);
apiRouter.use("/timetable", timetableRoutes);
apiRouter.use("/notifications", notificationRoutes);
apiRouter.use("/analytics", analyticsRoutes);
apiRouter.use("/ai", aiRoutes);
apiRouter.use("/upload-center", uploadCenterRoutes);

export default apiRouter;
