import express from "express";
import {
  createCoupon,
  getCoupons,
  toggleCouponActive,
  validateCoupon,
} from "../controllers/couponController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post("/validate", protect, validateCoupon);

router.get("/", protect, authorize("admin"), getCoupons);
router.post("/", protect, authorize("admin"), createCoupon);
router.patch("/:id/toggle-active", protect, authorize("admin"), toggleCouponActive);

export default router;