import express from "express";
import {
  createVendor,
  deactivateVendor,
  getVendorById,
  getVendors,
  updateVendor,
} from "../controllers/vendorController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.get("/", getVendors);
router.get("/:id", getVendorById);

router.post("/", protect, authorize("admin"), createVendor);
router.put("/:id", protect, authorize("admin"), updateVendor);
router.patch("/:id/deactivate", protect, authorize("admin"), deactivateVendor);

export default router;