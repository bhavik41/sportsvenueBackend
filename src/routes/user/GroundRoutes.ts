import { Router } from "express";
import { authenticate, authorizeRoles } from "../../middleware/auth";
import * as GroundRoutes from "../../controllers/user/GroundControllers";

const router = Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("user"),
  GroundRoutes.getAllGrounds
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("user"),
  GroundRoutes.getGroundById
);

export default router;
