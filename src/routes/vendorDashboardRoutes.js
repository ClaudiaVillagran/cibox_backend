import express from "express";
import {
  getVendorDashboard,
  getVendorSalesSummary,
} from "../controllers/vendorDashboardController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.use(protect, authorize("vendor", "admin"));

router.get("/", getVendorDashboard);
router.get("/sales-summary", getVendorSalesSummary);

export default router;