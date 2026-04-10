import express from 'express';
import {
  createProduct,
  deactivateProduct,
  getFeaturedProducts,
  getProductById,
  getProducts,
  getTopRatedProducts,
  updateProduct,
  getRelatedProducts,
  getRecommendedProductsForMe,
   reactivateProduct,
   updateProductStock,
} from '../controllers/productController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { getMyProducts } from '../controllers/orderController.js';

const router = express.Router();

router.get('/', getProducts);
router.get("/top-rated", getTopRatedProducts);
router.get("/featured", getFeaturedProducts);
router.get("/recommended/me", protect, getRecommendedProductsForMe);
router.get("/:id/related", getRelatedProducts);
router.patch('/:id/reactivate', protect, authorize('admin', 'vendor'), reactivateProduct);
router.patch("/:id/stock", protect, authorize("admin", "vendor"), updateProductStock);
router.get('/:id', getProductById);

router.get("/mine/list", protect, authorize("vendor", "admin"), getMyProducts);
router.post('/', protect, authorize('admin', 'vendor'), createProduct);
router.put('/:id', protect, authorize('admin', 'vendor'), updateProduct);
router.patch('/:id/deactivate', protect, authorize('admin', 'vendor'), deactivateProduct);

export default router;