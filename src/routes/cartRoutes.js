import express from "express";
import {
  addItemToCart,
  clearCart,
  getOrCreateCart,
  removeItemFromCart,
  updateCartItem,
} from "../controllers/cartController.js";
import { optionalAuth } from "../middlewares/optionalAuthMiddleware.js";

const router = express.Router();

router.get("/", optionalAuth, getOrCreateCart);
router.post("/items", optionalAuth, addItemToCart);
router.put("/items/:productId", optionalAuth, updateCartItem);
router.delete("/items/:productId", optionalAuth, removeItemFromCart);
router.delete("/clear/all", optionalAuth, clearCart);

export default router;