import Order from "../models/Order.js";
import {
  buildQuotePayloadFromOrder,
  validatePackages,
  quoteBlueShipment,
  createBlueShipment,
} from "../services/blueExpressService.js";

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

    if (String(order.user_id) !== String(req.user.id)) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const payload = buildQuotePayloadFromOrder(order);
    const validationError = validatePackages(payload.packages);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const quote = await quoteBlueShipment(payload);

    return res.status(200).json({
      message: "Cotización obtenida",
      quote,
    });
  } catch (error) {
    console.error("BLUE QUOTE ERROR:", error?.response?.data || error.message);
    return res.status(500).json({
      message: "No se pudo cotizar el envío",
      error: error.message,
    });
  }
};

export const applyShippingToOrder = async (req, res) => {
  try {
    const { orderId, shippingAmount, serviceName } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    if (String(order.user_id) !== String(req.user.id)) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const itemsTotal = Number(
      order.items?.reduce((acc, item) => acc + Number(item.subtotal || 0), 0) ||
        0
    );

    const amount = Number(shippingAmount || 0);

    order.shipping.amount = amount;
    order.shipping.service_name = serviceName || null;
    order.shipping.carrier = "blueexpress";
    order.total = itemsTotal + amount;

    await order.save();

    return res.status(200).json({
      message: "Envío aplicado a la orden",
      order,
    });
  } catch (error) {
    console.error("APPLY SHIPPING ERROR:", error?.message);
    return res.status(500).json({
      message: "No se pudo aplicar el envío",
      error: error.message,
    });
  }
};

export const createShipmentForPaidOrder = async (orderId) => {
  const order = await Order.findById(orderId).populate("items.product_id");

  if (!order) {
    throw new Error("Orden no encontrada");
  }

  if (order.status !== "paid") {
    throw new Error("La orden aún no está pagada");
  }

  if (order.shipping?.tracking_number) {
    return order;
  }

  const payload = buildQuotePayloadFromOrder(order);
  const validationError = validatePackages(payload.packages);

  if (validationError) {
    throw new Error(validationError);
  }

  const shipmentPayload = {
    ...payload,
    serviceName: order.shipping?.service_name || null,
    orderId: String(order._id),
  };

  const shipment = await createBlueShipment(shipmentPayload);

  order.shipping.tracking_number =
    shipment?.trackingNumber ||
    shipment?.tracking_number ||
    shipment?.data?.trackingNumber ||
    null;

  order.shipping.shipment_status =
    shipment?.status || shipment?.shipment_status || "created";

  order.shipping.label_url =
    shipment?.labelUrl || shipment?.label_url || shipment?.data?.labelUrl || null;

  order.shipping.shipment_created_at = new Date();

  await order.save();

  return order;
};