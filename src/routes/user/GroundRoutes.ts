import { Router } from "express";
import { authenticate, authorizeRoles } from "../../middleware/auth";
import * as GroundControllers from "../../controllers/user/GroundControllers";

const router = Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("user"),
  GroundControllers.getAllGrounds
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("user"),
  GroundControllers.getGroundById
);

router.get(
  "/booking",
  authenticate,
  authorizeRoles("user"),
  GroundControllers.getBookings
);

export default router;
