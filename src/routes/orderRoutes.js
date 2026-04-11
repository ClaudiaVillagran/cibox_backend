import express from "express";
import {
  createOrderFromCustomBox,
  getMyOrders,
  getOrderById,
  createOrderFromCart,
  getGuestOrderById,
} from "../controllers/orderController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { optionalAuth } from "../middlewares/optionalAuthMiddleware.js";

const router = express.Router();

router.post("/from-cart", optionalAuth, createOrderFromCart);
router.post("/from-custom-box", protect, createOrderFromCustomBox);

router.get("/guest/:id", getGuestOrderById);

router.get("/my-orders", protect, getMyOrders);
router.get("/:id", protect, getOrderById);

export default router;