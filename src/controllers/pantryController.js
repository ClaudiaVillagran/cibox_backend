import Pantry from "../models/Pantry.js";
import Product from "../models/Product.js";
import CustomBox from "../models/CustomBox.js";
import User from "../models/User.js";
import { calculateItemPricing } from "../utils/pricing.js";
import Order from "../models/Order.js";
export const getMyPantry = async (req, res) => {
  try {
    const userId = req.user.id;

    let pantry = await Pantry.findOne({ user_id: userId });

    if (!pantry) {
      pantry = await Pantry.create({
        user_id: userId,
        items: [],
      });
    }

    res.json(pantry);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener la despensa",
      error: error.message,
    });
  }
};

export const addItemToPantry = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity, frequency } = req.body;

    if (!productId) {
      return res.status(400).json({
        message: "productId es obligatorio",
      });
    }

    const product = await Product.findById(productId);

    if (!product || !product.is_active) {
      return res.status(404).json({
        message: "Producto no encontrado o inactivo",
      });
    }

    let pantry = await Pantry.findOne({ user_id: userId });

    if (!pantry) {
      pantry = await Pantry.create({
        user_id: userId,
        items: [],
      });
    }

    const existingItemIndex = pantry.items.findIndex(
      (item) => item.product_id.toString() === productId
    );

    if (existingItemIndex >= 0) {
      pantry.items[existingItemIndex].quantity = quantity || pantry.items[existingItemIndex].quantity;
      pantry.items[existingItemIndex].frequency = frequency || pantry.items[existingItemIndex].frequency;
      pantry.items[existingItemIndex].price = product.pricing?.tiers?.[0]?.price || 0;
    } else {
      pantry.items.push({
        product_id: product._id,
        name: product.name,
        quantity: quantity || 1,
        frequency: frequency || "monthly",
        price: product.pricing?.tiers?.[0]?.price || 0,
      });
    }

    await pantry.save();

    res.status(201).json({
      message: "Producto agregado a la despensa",
      pantry,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al agregar producto a la despensa",
      error: error.message,
    });
  }
};

export const updatePantryItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { quantity, frequency } = req.body;

    const pantry = await Pantry.findOne({ user_id: userId });

    if (!pantry) {
      return res.status(404).json({
        message: "Despensa no encontrada",
      });
    }

    const itemIndex = pantry.items.findIndex(
      (item) => item.product_id.toString() === productId
    );

    if (itemIndex < 0) {
      return res.status(404).json({
        message: "Producto no existe en la despensa",
      });
    }

    if (quantity !== undefined) {
      pantry.items[itemIndex].quantity = quantity;
    }

    if (frequency !== undefined) {
      pantry.items[itemIndex].frequency = frequency;
    }

    await pantry.save();

    res.json({
      message: "Producto actualizado en la despensa",
      pantry,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar producto de la despensa",
      error: error.message,
    });
  }
};

export const removeItemFromPantry = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const pantry = await Pantry.findOne({ user_id: userId });

    if (!pantry) {
      return res.status(404).json({
        message: "Despensa no encontrada",
      });
    }

    pantry.items = pantry.items.filter(
      (item) => item.product_id.toString() !== productId
    );

    await pantry.save();

    res.json({
      message: "Producto eliminado de la despensa",
      pantry,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al eliminar producto de la despensa",
      error: error.message,
    });
  }
};
export const addPantryItemToCustomBox = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const pantry = await Pantry.findOne({ user_id: userId });

    if (!pantry) {
      return res.status(404).json({
        message: "Despensa no encontrada",
      });
    }

    const pantryItem = pantry.items.find(
      (item) => item.product_id.toString() === productId
    );

    if (!pantryItem) {
      return res.status(404).json({
        message: "El producto no está en la despensa",
      });
    }

    const product = await Product.findById(productId);

    if (!product || !product.is_active) {
      return res.status(404).json({
        message: "Producto no encontrado o inactivo",
      });
    }

    const user = await User.findById(userId);

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
      (item) => item.product_id.toString() === productId
    );

    const finalQuantity =
      existingItemIndex >= 0
        ? customBox.items[existingItemIndex].quantity + pantryItem.quantity
        : pantryItem.quantity;

    const pricing = calculateItemPricing({
      tiers: product.pricing.tiers,
      quantity: finalQuantity,
      product,
      user,
      fromPantry: true,
    });

    if (existingItemIndex >= 0) {
      customBox.items[existingItemIndex].quantity = finalQuantity;
      customBox.items[existingItemIndex].unit_price = pricing.unit_price;
      customBox.items[existingItemIndex].original_unit_price = pricing.original_unit_price;
      customBox.items[existingItemIndex].tier_label = pricing.tier_label;
      customBox.items[existingItemIndex].discount_applied = pricing.discount_applied;
      customBox.items[existingItemIndex].discount_percent = pricing.discount_percent;
      customBox.items[existingItemIndex].discount_amount_per_unit = pricing.discount_amount_per_unit;
      customBox.items[existingItemIndex].discount_source = pricing.discount_source;
      customBox.items[existingItemIndex].subtotal = pricing.subtotal;
      customBox.items[existingItemIndex].original_subtotal = pricing.original_subtotal;
    } else {
      customBox.items.push({
        product_id: product._id,
        name: product.name,
        quantity: pantryItem.quantity,
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

    customBox.total = customBox.items.reduce((acc, item) => acc + item.subtotal, 0);

    await customBox.save();

    res.json({
      message: "Producto agregado desde despensa a la caja con descuento",
      customBox,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al mover producto desde despensa a la caja",
      error: error.message,
    });
  }
};

export const checkoutPantry = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shipping, payment } = req.body;

    if (!shipping?.region || !shipping?.city || !shipping?.address) {
      return res.status(400).json({
        message: "Los datos de envío son obligatorios",
      });
    }

    const pantry = await Pantry.findOne({ user_id: userId });

    if (!pantry) {
      return res.status(404).json({
        message: "Despensa no encontrada",
      });
    }

    if (!pantry.items.length) {
      return res.status(400).json({
        message: "La despensa está vacía",
      });
    }

    const user = await User.findById(userId);

    const orderItems = [];
    let total = 0;
    let totalOriginal = 0;

    for (const pantryItem of pantry.items) {
      const product = await Product.findById(pantryItem.product_id);

      if (!product) {
        return res.status(404).json({
          message: `Producto no encontrado: ${pantryItem.name}`,
        });
      }

      if (!product.is_active) {
        return res.status(400).json({
          message: `El producto ${product.name} está inactivo`,
        });
      }

      if (product.stock < pantryItem.quantity) {
        return res.status(400).json({
          message: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`,
        });
      }

      const pricing = calculateItemPricing({
        tiers: product.pricing.tiers,
        quantity: pantryItem.quantity,
        product,
        user,
        fromPantry: true,
      });

      orderItems.push({
        product_id: product._id,
        name: product.name,
        quantity: pantryItem.quantity,
        price: pricing.unit_price,
        original_price: pricing.original_unit_price,
        tier_label: pricing.tier_label,
        discount_applied: pricing.discount_applied,
        discount_percent: pricing.discount_percent,
        discount_amount_per_unit: pricing.discount_amount_per_unit,
        discount_source: pricing.discount_source,
        subtotal: pricing.subtotal,
        original_subtotal: pricing.original_subtotal,
      });

      total += pricing.subtotal;
      totalOriginal += pricing.original_subtotal;
    }

    for (const pantryItem of pantry.items) {
      await Product.findByIdAndUpdate(
        pantryItem.product_id,
        { $inc: { stock: -pantryItem.quantity } },
        { new: true }
      );
    }

    const order = await Order.create({
      user_id: userId,
      items: orderItems,
      total,
      status: "pending",
      source: "direct_product",
      payment: {
        method: payment?.method || "webpay",
        status: payment?.status || "pending",
        transaction_id: payment?.transaction_id || null,
      },
      shipping,
    });

    res.status(201).json({
      message: "Orden creada correctamente desde la despensa",
      order,
      summary: {
        total_original: totalOriginal,
        total_final: total,
        total_discount: totalOriginal - total,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al generar checkout desde despensa",
      error: error.message,
    });
  }
};