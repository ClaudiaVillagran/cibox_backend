import axios from "axios";

const blueClient = axios.create({
  baseURL: process.env.BLUE_BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.BLUE_API_TOKEN}`,
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

export const toGrams = (weight = {}) => {
  const value = Number(weight?.value || 0);
  const unit = String(weight?.unit || "g").toLowerCase();

  if (unit === "kg") return Math.round(value * 1000);
  return Math.round(value);
};

export const toCentimeters = (dimensions = {}) => {
  const unit = String(dimensions?.unit || "cm").toLowerCase();

  const length = Number(dimensions?.length || 0);
  const width = Number(dimensions?.width || 0);
  const height = Number(dimensions?.height || 0);

  if (unit === "m") {
    return {
      length: Math.round(length * 100),
      width: Math.round(width * 100),
      height: Math.round(height * 100),
    };
  }

  return {
    length: Math.round(length),
    width: Math.round(width),
    height: Math.round(height),
  };
};

export const buildPackagesFromOrder = (order) => {
  const packages = [];

  for (const item of order.items || []) {
    const product = item.product_id;
    if (!product) continue;

    const grams = toGrams(product.weight);
    const dims = toCentimeters(product.dimensions);
    const quantity = Number(item.quantity || 0);

    for (let i = 0; i < quantity; i += 1) {
      packages.push({
        weight: grams,
        length: dims.length,
        width: dims.width,
        height: dims.height,
        declaredValue: Number(item.price || 0),
        sku: product.sku || "",
        name: product.name || item.name || "Producto",
      });
    }
  }

  return packages;
};

export const validatePackages = (packages = []) => {
  if (!packages.length) {
    return "No se pudieron construir los paquetes";
  }

  const hasInvalidPackage = packages.some(
    (p) => !p.weight || !p.length || !p.width || !p.height
  );

  if (hasInvalidPackage) {
    return "Hay productos sin peso o dimensiones válidas";
  }

  return null;
};

export const buildQuotePayloadFromOrder = (order) => {
  const packages = buildPackagesFromOrder(order);

  return {
    origin: {
      region: process.env.BLUE_ORIGIN_REGION,
      city: process.env.BLUE_ORIGIN_CITY,
      address: process.env.BLUE_ORIGIN_ADDRESS,
      name: process.env.BLUE_ORIGIN_NAME,
      phone: process.env.BLUE_ORIGIN_PHONE,
    },
    destination: {
      fullName: order.customer?.fullName || "Cliente CIBOX",
      email: order.customer?.email || null,
      phone: order.customer?.phone || null,
      region: order.shipping?.region,
      city: order.shipping?.city,
      address: order.shipping?.address,
      addressLine2: order.shipping?.addressLine2 || null,
      reference: order.shipping?.reference || null,
    },
    packages,
  };
};

// OJO: AJUSTA estos endpoints cuando Blue te entregue la doc real
export const quoteBlueShipment = async (payload) => {
  const { data } = await blueClient.post("/quotes", payload);
  return data;
};

export const createBlueShipment = async (payload) => {
  const { data } = await blueClient.post("/shipments", payload);
  return data;
};

export const getBlueTracking = async (trackingNumber) => {
  const { data } = await blueClient.get(`/shipments/${trackingNumber}`);
  return data;
};