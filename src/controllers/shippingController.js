import Order from "../models/Order.js";
import {
  buildPackagesFromOrder,
  quoteBlueShipment,
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

    const packages = buildPackagesFromOrder(order);

    if (!packages.length) {
      return res.status(400).json({
        message: "No se pudieron construir los paquetes",
      });
    }

    const hasInvalidPackage = packages.some(
      (p) => !p.weight || !p.length || !p.width || !p.height
    );

    if (hasInvalidPackage) {
      return res.status(400).json({
        message: "Hay productos sin peso o dimensiones válidas",
      });
    }

    const payload = {
      origin: {
        region: process.env.BLUE_ORIGIN_REGION,
        city: process.env.BLUE_ORIGIN_CITY,
        address: process.env.BLUE_ORIGIN_ADDRESS,
        name: process.env.BLUE_ORIGIN_NAME,
        phone: process.env.BLUE_ORIGIN_PHONE,
      },
      destination: {
        region: order.shipping.region,
        city: order.shipping.city,
        address: order.shipping.address,
      },
      packages,
    };

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
      order.items?.reduce(
        (acc, item) => acc + Number(item.subtotal || 0),
        0
      ) || 0
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