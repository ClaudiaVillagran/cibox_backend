import express from "express";
import {
  previewShipping,
  quoteShipping,
  applyShippingToOrder,
} from "../controllers/shippingController.js";
import { optionalAuth } from "../middlewares/optionalAuthMiddleware.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/preview", optionalAuth, previewShipping);
router.post("/quote", protect, quoteShipping);
router.post("/apply", optionalAuth, applyShippingToOrder);

export default router;