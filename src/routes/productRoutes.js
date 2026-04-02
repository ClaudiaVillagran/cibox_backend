import express from 'express';
import {
  createProduct,
  deactivateProduct,
  getProductById,
  getProducts,
  updateProduct
} from '../controllers/productController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);

router.post('/', protect, authorize('admin', 'vendor'), createProduct);
router.put('/:id', protect, authorize('admin', 'vendor'), updateProduct);
router.patch('/:id/deactivate', protect, authorize('admin', 'vendor'), deactivateProduct);

export default router;