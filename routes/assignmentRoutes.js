import express from "express";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { validateRequest } from "../middlewares/validate.js";
import { createAssignment, getAssignmentsByClass, getAssignmentsByStudent, getSubmission, saveSubmission } from "../controllers/assignmentController.js";
import { assignmentCreateSchema, classIdParamsSchema, submissionAssignmentParamsSchema, submissionAssignmentStudentParamsSchema, submissionUpsertSchema } from "../validators/apiSchemas.js";

const router = express.Router();

router.get("/student/:studentId", asyncHandler(getAssignmentsByStudent));
router.get(
	"/:assignmentId/submissions/:studentId",
	validateRequest({ params: submissionAssignmentStudentParamsSchema }),
	asyncHandler(getSubmission),
);
router.post(
	"/:assignmentId/submissions",
	validateRequest({ params: submissionAssignmentParamsSchema, body: submissionUpsertSchema }),
	asyncHandler(saveSubmission),
);
router.patch(
	"/:assignmentId/submissions/:studentId",
	validateRequest({ params: submissionAssignmentStudentParamsSchema, body: submissionUpsertSchema.partial() }),
	asyncHandler(saveSubmission),
);
router.get("/:classId", validateRequest({ params: classIdParamsSchema }), asyncHandler(getAssignmentsByClass));
router.post("/", validateRequest({ body: assignmentCreateSchema }), asyncHandler(createAssignment));

export default router;

