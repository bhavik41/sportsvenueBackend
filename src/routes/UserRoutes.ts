import { Router } from "express";
import * as UserControllers from "../controllers/UserControllers";
import { authenticate, authorizeRoles } from "../middleware/auth";

const router = Router();

router.post("/signup", UserControllers.signUp);
router.post("/signin", UserControllers.signIn);

// Example protected route accessible only to authenticated users
router.get("/profile", authenticate, UserControllers.getUserProfile);

// Example admin-only route
router.get("/admin", authenticate, authorizeRoles("admin"), (req, res) => {
  res.status(200).json({ message: "This is an admin-only route" });
});

export default router;
