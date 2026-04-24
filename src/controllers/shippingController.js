import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import { quoteManualShippingForOrder } from "../services/manualShippingService.js";

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

export const previewShipping = async (req, res) => {
  try {
    const { shipping } = req.body;

    if (!shipping?.region || !shipping?.city || !shipping?.address) {
      return res.status(400).json({
        message: "region, city y address son requeridos",
      });
    }

    const ownerFilter = getCartOwnerFilter(req);

    if (!ownerFilter) {
      return res.status(400).json({
        message: "No se pudo identificar el carrito. Falta token o x-guest-id.",
      });
    }

    const cart = await Cart.findOne(ownerFilter).populate("items.product_id");

    if (!cart || !cart.items?.length) {
      return res.status(400).json({
        message: "No hay productos en el carrito",
      });
    }

    const previewOrder = {
      items: cart.items.map((item) => ({
        ...(item.toObject ? item.toObject() : item),
        product_id: item.product_id,
        quantity: item.quantity,
      })),
      shipping: {
        region: shipping.region,
        city: shipping.city,
        address: shipping.address,
        addressLine2: shipping.addressLine2 || null,
        reference: shipping.reference || null,
      },
    };

    const quote = quoteManualShippingForOrder(previewOrder);

    return res.status(200).json({
      message: "Vista previa de envío obtenida",
      quote,
    });
  } catch (error) {
    console.error("PREVIEW SHIPPING ERROR:", error.message);
    return res.status(500).json({
      message: error.message || "No se pudo previsualizar el envío",
    });
  }
};

export const quoteShipping = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "orderId es requerido" });
    }

    const order = await Order.findById(orderId).populate("items.product_id");

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    if (req.user?.id && String(order.user_id) !== String(req.user.id)) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const quote = quoteManualShippingForOrder(order);

    return res.status(200).json({
      message: "Cotización obtenida",
      quote,
    });
  } catch (error) {
    console.error("MANUAL SHIPPING QUOTE ERROR:", error.message);

    return res.status(500).json({
      message: error.message || "No se pudo cotizar el envío",
    });
  }
};

export const applyShippingToOrder = async (req, res) => {
  try {
    const { orderId, shippingAmount, serviceName, serviceCode } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    if (req.user?.id && String(order.user_id) !== String(req.user.id)) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const itemsTotal = Number(
      order.items?.reduce((acc, item) => acc + Number(item.subtotal || 0), 0) || 0
    );

    const amount = Number(shippingAmount || 0);

    order.shipping.amount = amount;
    order.shipping.service_name = serviceName || "Blue Express manual";
    order.shipping.service_code = serviceCode || null;
    order.shipping.carrier = "blueexpress_manual";
    order.total = itemsTotal + amount;

    await order.save();

    return res.status(200).json({
      message: "Envío aplicado a la orden",
      order,
    });
  } catch (error) {
    console.error("APPLY SHIPPING ERROR:", error.message);

    return res.status(500).json({
      message: "No se pudo aplicar el envío",
      error: error.message,
    });
  }
};

export const createShipmentForPaidOrder = async (orderId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Orden no encontrada");
  }


  if (order.status !== "paid") {
    throw new Error("La orden aún no está pagada");
  }

  return order;
};