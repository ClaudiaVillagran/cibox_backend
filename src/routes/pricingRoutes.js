import express from 'express';
import { calculateProductPrice } from '../controllers/pricingController.js';

const router = express.Router();

router.post('/calculate', calculateProductPrice);

export default router;