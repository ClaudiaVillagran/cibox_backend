import express from "express";
import {
  createWebpayTransaction,
  commitWebpayTransaction,
  handleWebpayReturn,
} from "../controllers/paymentController.js";
import { protect } from "../middlewares/authMiddleware.js";

import { optionalAuth } from "../middlewares/optionalAuthMiddleware.js";
const router = express.Router();

router.post("/webpay/create", optionalAuth, createWebpayTransaction);
router.post("/webpay/commit", optionalAuth, commitWebpayTransaction);

// Transbank puede volver por GET o POST según el flujo
router.get("/webpay/return", handleWebpayReturn);
router.post("/webpay/return", handleWebpayReturn);

export default router;