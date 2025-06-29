"use strict";
// src/routes/groundRoutes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const GroundControllers_1 = require("../../controllers/admin/GroundControllers");
const auth_1 = require("../../middleware/auth");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ dest: "uploads/" });
router.post("/", upload.array("images"), GroundControllers_1.createGround);
router.put("/:id", upload.array("images"), GroundControllers_1.updateGround);
router.get("/", auth_1.authenticate, GroundControllers_1.getAllGrounds);
router.get("/:id", auth_1.authenticate, GroundControllers_1.getAllGroundsByAdminId);
router.delete("/:id", auth_1.authenticate, GroundControllers_1.deleteGround);
exports.default = router;
