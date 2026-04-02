import express from "express";
import {
  createReview,
  deleteMyReview,
  getMyReviewForProduct,
  getProductReviews,
  updateMyReview,
} from "../controllers/reviewController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/product/:productId", getProductReviews);
router.get("/product/:productId/me", protect, getMyReviewForProduct);

router.post("/", protect, createReview);
router.put("/product/:productId", protect, updateMyReview);
router.delete("/product/:productId", protect, deleteMyReview);

export default router;