import express from 'express';
import {
  addItemToCustomBox,
  getOrCreateCustomBox,
  removeItemFromCustomBox,
  updateCustomBoxItem
} from '../controllers/customBoxController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getOrCreateCustomBox);
router.post('/items', protect, addItemToCustomBox);
router.put('/items/:productId', protect, updateCustomBoxItem);
router.delete('/items/:productId', protect, removeItemFromCustomBox);

export default router;