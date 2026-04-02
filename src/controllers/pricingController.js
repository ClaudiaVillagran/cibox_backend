import Product from '../models/Product.js';
import { calculateItemPricing } from '../utils/pricing.js';

export const calculateProductPrice = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

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

    const pricing = calculateItemPricing(product.pricing.tiers, Number(quantity));

    res.json({
      message: 'Precio calculado correctamente',
      product: {
        id: product._id,
        name: product.name
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