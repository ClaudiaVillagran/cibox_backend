import express from "express";
import {
  approveVendor,
  getAllOrders,
  getAllProductsAdmin,
  getAllUsers,
  getPendingVendors,
  toggleProductActive,
  updateOrderStatus,
  updateUserRole,
} from "../controllers/adminController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/users", getAllUsers);
router.patch("/users/:id/role", updateUserRole);

router.get("/orders", getAllOrders);
router.patch("/orders/:id/status", updateOrderStatus);

router.get("/vendors/pending", getPendingVendors);
router.patch("/vendors/:id/approve", approveVendor);

router.get("/products", getAllProductsAdmin);
router.patch("/products/:id/toggle-active", toggleProductActive);

export default router;