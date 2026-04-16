import express from "express";
import {
  createCategory,
  deactivateCategory,
  getCategories,
  getCategoryById,
  getFeaturedCategories,
  updateCategory,
} from "../controllers/categoryController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.get("/featured", getFeaturedCategories);
router.get("/", getCategories);
router.get("/:id", getCategoryById);

router.post("/", protect, authorize("admin"), createCategory);
router.put("/:id", protect, authorize("admin"), updateCategory);
router.patch("/:id/deactivate", protect, authorize("admin"), deactivateCategory);

export default router;