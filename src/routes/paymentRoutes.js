import express from "express";
import {
  createWebpayTransaction,
  commitWebpayTransaction,
  handleWebpayReturn,
} from "../controllers/paymentController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/webpay/create", protect, createWebpayTransaction);
router.post("/webpay/commit", protect, commitWebpayTransaction);

// Transbank puede volver por GET o POST según el flujo
router.get("/webpay/return", handleWebpayReturn);
router.post("/webpay/return", handleWebpayReturn);

export default router;