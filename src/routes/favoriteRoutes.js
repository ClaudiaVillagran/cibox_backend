import express from "express";
import {
  addFavorite,
  checkFavorite,
  getMyFavorites,
  removeFavorite,
} from "../controllers/favoriteController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getMyFavorites);
router.get("/:productId/check", checkFavorite);
router.post("/", addFavorite);
router.delete("/:productId", removeFavorite);

export default router;