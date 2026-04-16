import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  previewShipping,
  quoteShipping,
  applyShippingToOrder,
} from "../controllers/shippingController.js";

const router = express.Router();

router.post("/preview", protect, previewShipping);
router.post("/quote", protect, quoteShipping);
router.post("/apply", protect, applyShippingToOrder);

export default router;