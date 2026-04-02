import express from "express";
import {
  addItemToPantry,
  getMyPantry,
  removeItemFromPantry,
  updatePantryItem,
  addPantryItemToCustomBox,
  checkoutPantry,
} from "../controllers/pantryController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getMyPantry);
router.post("/items", protect, addItemToPantry);
router.put("/items/:productId", protect, updatePantryItem);
router.delete("/items/:productId", protect, removeItemFromPantry);
router.post("/items/:productId/add-to-box", protect, addPantryItemToCustomBox);
router.post("/checkout", protect, checkoutPantry);

export default router;