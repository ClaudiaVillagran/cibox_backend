import CustomBox from "../models/CustomBox.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { calculateItemPricing } from "../utils/pricing.js";

const recalculateBoxTotal = (items) => {
  return items.reduce((acc, item) => acc + item.subtotal, 0);
};

export const getOrCreateCustomBox = async (req, res) => {
  try {
    const userId = req.user.id;

    let customBox = await CustomBox.findOne({
      user_id: userId,
      status: "draft",
    });
    console.log(customBox);

    if (!customBox) {
      customBox = await CustomBox.create({
        user_id: userId,
        status: "draft",
        items: [],
        total: 0,
      });
    }

    res.json(customBox);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener la caja personalizada",
      error: error.message,
    });
  }
};

export const addItemToCustomBox = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;
    const user = await User.findById(userId);

    if (!productId || !quantity) {
      return res.status(400).json({
        message: "productId y quantity son obligatorios",
      });
    }

    const product = await Product.findById(productId);

    if (!product || !product.is_active) {
      return res.status(404).json({
        message: "Producto no encontrado o inactivo",
      });
    }

    let customBox = await CustomBox.findOne({
      user_id: userId,
      status: "draft",
    });

    if (!customBox) {
      customBox = await CustomBox.create({
        user_id: userId,
        status: "draft",
        items: [],
        total: 0,
      });
    }

    const existingItemIndex = customBox.items.findIndex(
      (item) => item.product_id.toString() === productId,
    );

    if (existingItemIndex >= 0) {
      customBox.items[existingItemIndex].quantity += Number(quantity);
      customBox.items[existingItemIndex].thumbnail =
        product.thumbnail || product.images?.[0] || "";
      const updatedQuantity = customBox.items[existingItemIndex].quantity;

      const pricing = calculateItemPricing({
        tiers: product.pricing.tiers,
        quantity: updatedQuantity,
        product,
        user,
      });

      customBox.items[existingItemIndex].unit_price = pricing.unit_price;
      customBox.items[existingItemIndex].original_unit_price =
        pricing.original_unit_price;
      customBox.items[existingItemIndex].tier_label = pricing.tier_label;
      customBox.items[existingItemIndex].discount_applied =
        pricing.discount_applied;
      customBox.items[existingItemIndex].discount_percent =
        pricing.discount_percent;
      customBox.items[existingItemIndex].discount_amount_per_unit =
        pricing.discount_amount_per_unit;
      customBox.items[existingItemIndex].discount_source =
        pricing.discount_source;
      customBox.items[existingItemIndex].subtotal = pricing.subtotal;
      customBox.items[existingItemIndex].original_subtotal =
        pricing.original_subtotal;
    } else {
      const pricing = calculateItemPricing({
        tiers: product.pricing.tiers,
        quantity: Number(quantity),
        product,
        user,
      });

      customBox.items.push({
        product_id: product._id,
        name: product.name,
        thumbnail: product.thumbnail || product.images?.[0] || "",
        quantity: Number(quantity),
        unit_price: pricing.unit_price,
        original_unit_price: pricing.original_unit_price,
        tier_label: pricing.tier_label,
        discount_applied: pricing.discount_applied,
        discount_percent: pricing.discount_percent,
        discount_amount_per_unit: pricing.discount_amount_per_unit,
        discount_source: pricing.discount_source,
        subtotal: pricing.subtotal,
        original_subtotal: pricing.original_subtotal,
      });
    }

    customBox.total = recalculateBoxTotal(customBox.items);

    await customBox.save();

    res.json({
      message: "Producto agregado a la caja",
      customBox,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al agregar producto a la caja",
      error: error.message,
    });
  }
};

export const updateCustomBoxItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        message: "La cantidad debe ser mayor o igual a 1",
      });
    }

    const user = await User.findById(userId);

    const customBox = await CustomBox.findOne({
      user_id: userId,
      status: "draft",
    });

    if (!customBox) {
      return res.status(404).json({
        message: "Caja no encontrada",
      });
    }

    const itemIndex = customBox.items.findIndex(
      (item) => item.product_id.toString() === productId,
    );

    if (itemIndex < 0) {
      return res.status(404).json({
        message: "Producto no existe en la caja",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Producto no encontrado",
      });
    }

    const pricing = calculateItemPricing({
      tiers: product.pricing.tiers,
      quantity: Number(quantity),
      product,
      user,
    });

    customBox.items[itemIndex].quantity = Number(quantity);
    customBox.items[itemIndex].unit_price = pricing.unit_price;
    customBox.items[itemIndex].original_unit_price =
      pricing.original_unit_price;
    customBox.items[itemIndex].tier_label = pricing.tier_label;
    customBox.items[itemIndex].discount_applied = pricing.discount_applied;
    customBox.items[itemIndex].discount_percent = pricing.discount_percent;
    customBox.items[itemIndex].discount_amount_per_unit =
      pricing.discount_amount_per_unit;
    customBox.items[itemIndex].discount_source = pricing.discount_source;
    customBox.items[itemIndex].subtotal = pricing.subtotal;
    customBox.items[itemIndex].original_subtotal = pricing.original_subtotal;

    customBox.total = recalculateBoxTotal(customBox.items);

    await customBox.save();

    res.json({
      message: "Cantidad actualizada correctamente",
      customBox,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar item de la caja",
      error: error.message,
    });
  }
};

export const removeItemFromCustomBox = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const customBox = await CustomBox.findOne({
      user_id: userId,
      status: "draft",
    });

    if (!customBox) {
      return res.status(404).json({
        message: "Caja no encontrada",
      });
    }

    customBox.items = customBox.items.filter(
      (item) => item.product_id.toString() !== productId,
    );

    customBox.total = recalculateBoxTotal(customBox.items);

    await customBox.save();

    res.json({
      message: "Producto eliminado de la caja",
      customBox,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al eliminar item de la caja",
      error: error.message,
    });
  }
};
