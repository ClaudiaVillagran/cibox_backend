import CustomBox from "../models/CustomBox.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import CouponUsage from "../models/CouponUsage.js";
import Vendor from "../models/Vendor.js";
import {
  createNotification,
  createNotificationsForRole,
} from "../utils/notification.js";
import {
  calculateCouponDiscount,
  validateCouponForUser,
} from "../utils/coupon.js";

export const createOrderFromCustomBox = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shipping, payment, couponCode } = req.body;
    console.log(req.body);

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
    const subtotalBeforeCoupon = customBox.total;
    let coupon = null;
    let couponDiscount = 0;

    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
      });

      const validation = await validateCouponForUser({
        coupon,
        userId,
        subtotal: subtotalBeforeCoupon,
      });

      if (!validation.valid) {
        return res.status(400).json({
          message: validation.message,
        });
      }

      couponDiscount = calculateCouponDiscount({
        coupon,
        subtotal: subtotalBeforeCoupon,
      });
    }

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
        discount_source: item.discount_source,
      });
    }

    const order = await Order.create({
      user_id: userId,
      custom_box_id: customBox._id,
      items: orderItems,
      total: subtotalBeforeCoupon - couponDiscount,
      status: "pending",
      source: "custom_box",
      payment: {
        method: payment?.method || "webpay",
        status: "pending",
        transaction_id: null,
        token: null,
        buy_order: null,
        session_id: null,
        amount: subtotalBeforeCoupon - couponDiscount,
        authorization_code: null,
        response_code: null,
        transaction_date: null,
      },
      shipping,
      coupon: coupon
        ? {
            code: coupon.code,
            discount_amount: couponDiscount,
          }
        : {
            code: null,
            discount_amount: 0,
          },
    });

    const totalOriginal = customBox.items.reduce(
      (acc, item) => acc + (item.original_subtotal || item.subtotal),
      0,
    );

    const totalDiscountFromItems = totalOriginal - customBox.total;

    res.status(201).json({
      message: "Orden pendiente de pago creada correctamente",
      order,
      summary: {
        total_original: totalOriginal,
        total_items_discount: totalDiscountFromItems,
        coupon_discount: couponDiscount,
        total_final: subtotalBeforeCoupon - couponDiscount,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al crear la orden",
      error: error.message,
    });
  }
};
export const getMyProducts = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      return res
        .status(400)
        .json({ message: "Admin debe usar filtros normales" });
    }

    const vendor = await Vendor.findOne({ user_id: req.user.id });
    console.log(vendor);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor no encontrado" });
    }

    const products = await Product.find({
      "vendor.id": vendor._id.toString(),
    }).sort({ created_at: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener mis productos",
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
