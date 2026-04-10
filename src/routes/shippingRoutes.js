import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  quoteShipping,
  applyShippingToOrder,
} from "../controllers/shippingController.js";

const router = express.Router();

router.post("/quote", protect, quoteShipping);
router.post("/apply", protect, applyShippingToOrder);

export default router;