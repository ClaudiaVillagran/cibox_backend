import Product from '../models/Product.js';
import User from '../models/User.js';
import { calculateItemPricing } from '../utils/pricing.js';

export const calculateProductPrice = async (req, res) => {
  try {
    const { productId, quantity, userId } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({
        message: 'productId y quantity son obligatorios'
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: 'Producto no encontrado'
      });
    }

    let user = null;

    if (userId) {
      user = await User.findById(userId);
    }

    const pricing = calculateItemPricing({
      tiers: product.pricing.tiers,
      quantity: Number(quantity),
      product,
      user
    });

    res.json({
      message: 'Precio calculado correctamente',
      product: {
        id: product._id,
        name: product.name,
        cibox_plus_enabled: product.cibox_plus?.enabled || false
      },
      pricing
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al calcular precio',
      error: error.message
    });
  }
};