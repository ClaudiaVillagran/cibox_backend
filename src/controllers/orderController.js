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
import Cart from "../models/Cart.js";
import {
  formatRut,
  isValidEmailFormat,
  isValidPhoneCL,
  isValidRut,
  normalizeEmail,
  normalizePhoneCL,
  validateCheckoutPayload,
} from "../utils/checkoutValidation.js";

const getCartOwnerFilter = (req) => {
  if (req.user?.id) {
    return {
      user_id: req.user.id,
      status: "active",
    };
  }

  const guestId = req.headers["x-guest-id"];

  if (!guestId) {
    return null;
  }

  return {
    guest_id: guestId,
    status: "active",
  };
};

export const createOrderFromCart = async (req, res) => {
  try {
    const ownerFilter = getCartOwnerFilter(req);

    if (!ownerFilter) {
      return res.status(400).json({
        message: "No se pudo identificar el carrito",
      });
    }

    const cart = await Cart.findOne(ownerFilter);

    if (!cart || !Array.isArray(cart.items) || !cart.items.length) {
      return res.status(400).json({
        message: "El carrito está vacío",
      });
    }

    const { customer, shipping, payment, notes, couponCode } = req.body;

    const normalizedCustomer = {
      fullName: String(customer?.fullName || "").trim(),
      email: normalizeEmail(customer?.email),
      phone: normalizePhoneCL(customer?.phone),
      rut: formatRut(customer?.rut || ""),
    };

    const normalizedShipping = {
      region: String(shipping?.region || "").trim(),
      city: String(shipping?.city || "").trim(),
      address: String(shipping?.address || "").trim(),
      addressLine2: String(shipping?.addressLine2 || "").trim() || null,
      reference: String(shipping?.reference || "").trim() || null,
    };

    const errors = validateCheckoutPayload({
      customer: normalizedCustomer,
      shipping: normalizedShipping,
    });

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: "Hay campos inválidos en el checkout",
        errors,
      });
    }

    const validatedItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product_id);

      if (!product || !product.is_active) {
        return res.status(400).json({
          message: `Uno de los productos ya no está disponible: ${item.name}`,
        });
      }

      validatedItems.push({
        product_id: item.product_id,
        name: item.name,
        quantity: Number(item.quantity || 0),
        price: Number(item.unit_price || 0),
        original_price: Number(item.unit_price || 0),
        tier_label: null,
        discount_applied: false,
        discount_percent: 0,
        discount_amount_per_unit: 0,
        discount_source: null,
        subtotal: Number(item.subtotal || 0),
        original_subtotal: Number(item.subtotal || 0),
      });
    }

    const itemsTotal = validatedItems.reduce(
      (acc, item) => acc + Number(item.subtotal || 0),
      0
    );

    const order = await Order.create({
      user_id: req.user?.id || null,
      guest_id: req.user?.id ? null : req.headers["x-guest-id"] || null,
      items: validatedItems,
      total: itemsTotal,
      customer: normalizedCustomer,
      shipping: {
        ...normalizedShipping,
        amount: 0,
        carrier: "blueexpress",
        service_name: null,
        tracking_number: null,
        shipment_status: null,
        label_url: null,
        service_code: null,
      },
      payment: {
        method: payment?.method || "webpay",
        platform: payment?.platform || "web",
        status: "pending",
        transaction_id: null,
        token: null,
        buy_order: null,
        session_id: null,
        amount: itemsTotal,
        authorization_code: null,
        response_code: null,
        transaction_date: null,
      },
      coupon: {
        code: couponCode || null,
        discount_amount: 0,
      },
      status: "pending",
      source: "cart",
      notes: String(notes || "").trim() || null,
    });

    cart.status = "converted";
    await cart.save();

    return res.status(201).json({
      message: "Orden creada correctamente desde el carrito",
      order,
    });
  } catch (error) {
    console.error("CREATE ORDER FROM CART ERROR:", error?.message);

    return res.status(500).json({
      message: "Error al crear la orden desde el carrito",
      error: error.message,
    });
  }
};

export const createOrderFromCustomBox = async (req, res) => {
  try {
    const box = await CustomBox.findOne({
      user_id: req.user.id,
      status: "draft",
    }).populate("items.product_id");

    if (!box || !box.items?.length) {
      return res.status(400).json({
        message: "No hay productos en la caja",
      });
    }

    const items = box.items.map((item) => ({
      product_id: item.product_id?._id || item.product_id,
      name: item.name,
      quantity: item.quantity,
      price: item.unit_price ?? item.price ?? 0,
      original_price: item.original_unit_price ?? item.original_price ?? null,
      tier_label: item.tier_label || null,
      discount_applied: !!item.discount_applied,
      discount_percent: Number(item.discount_percent || 0),
      discount_amount_per_unit: Number(item.discount_amount_per_unit || 0),
      discount_source: item.discount_source || null,
      subtotal: Number(item.subtotal || 0),
      original_subtotal: Number(item.original_subtotal || 0),
    }));

    const itemsTotal = items.reduce(
      (acc, item) => acc + Number(item.subtotal || 0),
      0
    );

    const order = await Order.create({
      user_id: req.user.id,
      customer: {
        fullName: req.body.customer?.fullName || null,
        email: req.body.customer?.email || null,
        phone: req.body.customer?.phone || null,
      },
      items,
      total: itemsTotal,
      status: "pending",
      source: "custom_box",
      payment: {
        method: req.body.payment?.method || "webpay",
        status: "pending",
        platform: "web",
      },
      shipping: {
        region: req.body.shipping?.region || "",
        city: req.body.shipping?.city || "",
        address: req.body.shipping?.address || "",
        addressLine2: req.body.shipping?.addressLine2 || null,
        reference: req.body.shipping?.reference || null,
        amount: 0,
        carrier: "blueexpress",
        service_name: null,
        tracking_number: null,
        shipment_status: null,
        label_url: null,
      },
      notes: req.body.notes || null,
    });

    return res.status(201).json({
      message: "Orden creada correctamente",
      order,
    });
  } catch (error) {
    console.error("CREATE ORDER FROM CUSTOM BOX ERROR:", error);
    return res.status(500).json({
      message: "No se pudo crear la orden",
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

// ✅ NUEVO: detalle para invitado
export const getGuestOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const email = String(req.query.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Debes proporcionar el email de la compra",
      });
    }

    const order = await Order.findOne({
      _id: id,
      user_id: null,
      "customer.email": email,
    });

    if (!order) {
      return res.status(404).json({
        message: "Orden no encontrada para ese correo",
      });
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener la orden de invitado",
      error: error.message,
    });
  }
};