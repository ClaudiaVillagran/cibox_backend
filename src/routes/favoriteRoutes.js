import express from "express";
import {
  addFavorite,
  checkFavorite,
  getMyFavorites,
  removeFavorite,
} from "../controllers/favoriteController.js";
import { optionalAuth } from "../middlewares/optionalAuthMiddleware.js";

const router = express.Router();

router.get("/", optionalAuth, getMyFavorites);
router.get("/:productId/check", optionalAuth, checkFavorite);
router.post("/", optionalAuth, addFavorite);
router.delete("/:productId", optionalAuth, removeFavorite);

export default router;