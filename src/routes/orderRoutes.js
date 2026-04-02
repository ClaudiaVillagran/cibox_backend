import express from 'express';
import {
  createOrderFromCustomBox,
  getMyOrders,
  getOrderById
} from '../controllers/orderController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/from-custom-box', protect, createOrderFromCustomBox);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);

export default router;