import express from "express";
import {
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../controllers/notificationController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getMyNotifications);
router.patch("/:id/read", markNotificationAsRead);
router.patch("/read-all", markAllNotificationsAsRead);

export default router;