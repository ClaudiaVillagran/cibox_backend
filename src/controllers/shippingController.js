// import Order from "../models/Order.js";
// import {
//   buildQuotePayloadFromOrder,
//   validatePackages,
//   quoteBlueShipment,
//   createBlueShipment,
// } from "../services/blueExpressService.js";

// export const quoteShipping = async (req, res) => {
//   try {
//     const { orderId } = req.body;

//     if (!orderId) {
//       return res.status(400).json({ message: "orderId es requerido" });
//     }

//     const order = await Order.findById(orderId).populate("items.product_id");

//     if (!order) {
//       return res.status(404).json({ message: "Orden no encontrada" });
//     }

//     if (String(order.user_id) !== String(req.user.id)) {
//       return res.status(403).json({ message: "No autorizado" });
//     }

//     const payload = buildQuotePayloadFromOrder(order);
//     const validationError = validatePackages(payload.packages);

//     if (validationError) {
//       return res.status(400).json({ message: validationError });
//     }

//     const quote = await quoteBlueShipment(payload);

//     return res.status(200).json({
//       message: "Cotización obtenida",
//       quote,
//     });
//   } catch (error) {
//     console.error("BLUE QUOTE ERROR:", error?.response?.data || error.message);
//     return res.status(500).json({
//       message: "No se pudo cotizar el envío",
//       error: error.message,
//     });
//   }
// };

// export const applyShippingToOrder = async (req, res) => {
//   try {
//     const { orderId, shippingAmount, serviceName } = req.body;

//     const order = await Order.findById(orderId);

//     if (!order) {
//       return res.status(404).json({ message: "Orden no encontrada" });
//     }

//     if (String(order.user_id) !== String(req.user.id)) {
//       return res.status(403).json({ message: "No autorizado" });
//     }

//     const itemsTotal = Number(
//       order.items?.reduce((acc, item) => acc + Number(item.subtotal || 0), 0) ||
//         0
//     );

//     const amount = Number(shippingAmount || 0);

//     order.shipping.amount = amount;
//     order.shipping.service_name = serviceName || null;
//     order.shipping.carrier = "blueexpress";
//     order.total = itemsTotal + amount;

//     await order.save();

//     return res.status(200).json({
//       message: "Envío aplicado a la orden",
//       order,
//     });
//   } catch (error) {
//     console.error("APPLY SHIPPING ERROR:", error?.message);
//     return res.status(500).json({
//       message: "No se pudo aplicar el envío",
//       error: error.message,
//     });
//   }
// };

// export const createShipmentForPaidOrder = async (orderId) => {
//   const order = await Order.findById(orderId).populate("items.product_id");

//   if (!order) {
//     throw new Error("Orden no encontrada");
//   }

//   if (order.status !== "paid") {
//     throw new Error("La orden aún no está pagada");
//   }

//   if (order.shipping?.tracking_number) {
//     return order;
//   }

//   const payload = buildQuotePayloadFromOrder(order);
//   const validationError = validatePackages(payload.packages);

//   if (validationError) {
//     throw new Error(validationError);
//   }

//   const shipmentPayload = {
//     ...payload,
//     serviceName: order.shipping?.service_name || null,
//     orderId: String(order._id),
//   };

//   const shipment = await createBlueShipment(shipmentPayload);

//   order.shipping.tracking_number =
//     shipment?.trackingNumber ||
//     shipment?.tracking_number ||
//     shipment?.data?.trackingNumber ||
//     null;

//   order.shipping.shipment_status =
//     shipment?.status || shipment?.shipment_status || "created";

//   order.shipping.label_url =
//     shipment?.labelUrl || shipment?.label_url || shipment?.data?.labelUrl || null;

//   order.shipping.shipment_created_at = new Date();

//   await order.save();

//   return order;
// };

import Order from "../models/Order.js";
import CustomBox from "../models/CustomBox.js";
import { quoteManualShippingForOrder } from "../services/manualShippingService.js";

export const previewShipping = async (req, res) => {
  try {
    const { shipping } = req.body;

    if (!shipping?.region || !shipping?.city || !shipping?.address) {
      return res.status(400).json({
        message: "region, city y address son requeridos",
      });
    }

    const box = await CustomBox.findOne({
      user_id: req.user.id,
      status: "draft",
    }).populate("items.product_id");

    if (!box || !box.items?.length) {
      return res.status(400).json({
        message: "No hay productos en la caja",
      });
    }

    const previewOrder = {
      items: box.items.map((item) => ({
        ...item.toObject(),
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

    if (String(order.user_id) !== String(req.user.id)) {
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

    if (String(order.user_id) !== String(req.user.id)) {
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