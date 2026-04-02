import CustomBox from "../models/CustomBox.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

export const createOrderFromCustomBox = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shipping, payment } = req.body;

    if (!shipping?.region || !shipping?.city || !shipping?.address) {
      return res.status(400).json({
        message: "Los datos de envío son obligatorios",
      });
    }

    const customBox = await CustomBox.findOne({
      user_id: userId,
      status: "draft",
    });

    if (!customBox) {
      return res.status(404).json({
        message: "No existe una caja activa para convertir en orden",
      });
    }

    if (!customBox.items.length) {
      return res.status(400).json({
        message: "La caja está vacía",
      });
    }

    const orderItems = [];

    for (const item of customBox.items) {
      const product = await Product.findById(item.product_id);

      if (!product) {
        return res.status(404).json({
          message: `Producto no encontrado: ${item.name}`,
        });
      }

      if (!product.is_active) {
        return res.status(400).json({
          message: `El producto ${product.name} está inactivo`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`,
        });
      }

      orderItems.push({
        product_id: item.product_id,
        name: item.name,
        quantity: item.quantity,
        price: item.unit_price,
        tier_label: item.tier_label,
        subtotal: item.subtotal,
        original_price: item.original_unit_price,
        original_subtotal: item.original_subtotal,
        discount_applied: item.discount_applied,
        discount_percent: item.discount_percent,
        discount_amount_per_unit: item.discount_amount_per_unit,
      });
    }

    for (const item of customBox.items) {
      await Product.findByIdAndUpdate(
        item.product_id,
        { $inc: { stock: -item.quantity } },
        { new: true },
      );
    }

    const order = await Order.create({
      user_id: userId,
      items: orderItems,
      total: customBox.total,
      status: "pending",
      source: "custom_box",
      payment: {
        method: payment?.method || "webpay",
        status: payment?.status || "pending",
        transaction_id: payment?.transaction_id || null,
      },
      shipping,
    });

    customBox.status = "confirmed";
    await customBox.save();

    res.status(201).json({
      message: "Orden creada correctamente desde la caja personalizada",
      order,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al crear la orden",
      error: error.message,
    });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ user_id: userId }).sort({
      created_at: -1,
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener órdenes",
      error: error.message,
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      user_id: userId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Orden no encontrada",
      });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener la orden",
      error: error.message,
    });
  }
};
