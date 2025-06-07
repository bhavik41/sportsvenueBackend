// src/routes/groundRoutes.ts

import express from "express";
import multer from "multer";
import {
  createGround,
  getAllGrounds,
  getAllGroundsByAdminId,
  updateGround,
} from "../../controllers/admin/GroundControllers";
import { authenticate } from "../../middleware/auth";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.array("images"), createGround);
router.put("/:id", upload.array("images"), updateGround);

router.get("/", authenticate, getAllGrounds);
router.get("/:id", authenticate, getAllGroundsByAdminId);

export default router;
