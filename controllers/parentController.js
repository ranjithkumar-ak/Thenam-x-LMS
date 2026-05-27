import { AppError } from "../utils/appError.js";
import { ok } from "../utils/apiResponse.js";
import { getParentOverview as getParentOverviewService } from "../services/parentService.js";

export async function getParentOverview(req, res) {
  const overview = await getParentOverviewService(req.params.parentId);
  if (!overview) {
    throw new AppError("Parent not found.", 404);
  }

  return ok(res, overview);
}