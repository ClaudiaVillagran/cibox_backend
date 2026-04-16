import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

const recalculateCartTotal = (items) => {
  return items.reduce((acc, item) => acc + Number(item.subtotal || 0), 0);
};

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

const createCartOwnerData = (req) => {
  if (req.user?.id) {
    return {
      user_id: req.user.id,
      guest_id: null,
      status: "active",
    };
  }

  const guestId = req.headers["x-guest-id"];

  if (!guestId) {
    return null;
  }

  return {
    user_id: null,
    guest_id: guestId,
    status: "active",
  };
};

const normalizeCartProductType = (productType) => {
  return productType === "box" ? "box" : "individual";
};

const buildBoxItemsDetails = async (rawBoxItems = []) => {
  if (!Array.isArray(rawBoxItems) || rawBoxItems.length === 0) {
    return [];
  }

  const productIds = rawBoxItems
    .map((item) => item?.product_id)
    .filter(Boolean);

  if (!productIds.length) {
    return [];
  }

  const products = await Product.find({
    _id: { $in: productIds },
  }).lean();

  const productsMap = new Map(
    products.map((product) => [String(product._id), product])
  );

  return rawBoxItems.map((boxItem) => {
    const product = productsMap.get(String(boxItem.product_id));
    const unitPrice = Number(product?.pricing?.tiers?.[0]?.price || 0);

    return {
      product_id: boxItem.product_id,
      quantity: Number(boxItem.quantity || 1),
      name: product?.name || "Producto",
      thumbnail: product?.thumbnail || product?.images?.[0] || "",
      unit_price: unitPrice,
      brand: product?.brand || "",
    };
  });
};

const buildCartItemFromProduct = async (product, quantity) => {
  const parsedQuantity = Number(quantity || 0);
  const basePrice = Number(product?.pricing?.tiers?.[0]?.price || 0);
  const normalizedProductType = normalizeCartProductType(product?.product_type);

  let enrichedBoxItems = [];

  if (normalizedProductType === "box") {
    enrichedBoxItems = await buildBoxItemsDetails(product?.box_items || []);
  }

  return {
    product_id: product._id,
    name: product.name,
    thumbnail: product.thumbnail || product.images?.[0] || "",
    quantity: parsedQuantity,
    unit_price: basePrice,
    subtotal: parsedQuantity * basePrice,
    product_type: normalizedProductType,
    box_items: enrichedBoxItems,
  };
};

const enrichCartItems = async (items = []) => {
  return Promise.all(
    items.map(async (item) => {
      const plainItem = item.toObject ? item.toObject() : item;
      const normalizedType = normalizeCartProductType(plainItem?.product_type);

      if (normalizedType !== "box") {
        return {
          ...plainItem,
          product_type: "individual",
          box_items: [],
        };
      }

      const enrichedBoxItems = await buildBoxItemsDetails(
        plainItem?.box_items || []
      );

      return {
        ...plainItem,
        product_type: "box",
        box_items: enrichedBoxItems,
      };
    })
  );
};

export const getOrCreateCart = async (req, res) => {
  try {
    const ownerFilter = getCartOwnerFilter(req);
    const ownerData = createCartOwnerData(req);

    if (!ownerFilter || !ownerData) {
      return res.status(400).json({
        message: "No se pudo identificar el carrito. Falta token o x-guest-id.",
      });
    }

    let cart = await Cart.findOne(ownerFilter);

    if (!cart) {
      cart = await Cart.create({
        ...ownerData,
        items: [],
        total: 0,
      });
    }

    const enrichedItems = await enrichCartItems(cart.items || []);

    return res.status(200).json({
      ...cart.toObject(),
      items: enrichedItems,
      total: recalculateCartTotal(enrichedItems),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener el carrito",
      error: error.message,
    });
  }
};

export const addItemToCart = async (req, res) => {
  try {
    const ownerFilter = getCartOwnerFilter(req);
    const ownerData = createCartOwnerData(req);
    const { productId, quantity } = req.body;

    if (!ownerFilter || !ownerData) {
      return res.status(400).json({
        message: "No se pudo identificar el carrito. Falta token o x-guest-id.",
      });
    }

    if (!productId || !quantity) {
      return res.status(400).json({
        message: "productId y quantity son obligatorios",
      });
    }

    const parsedQuantity = Number(quantity);

    if (parsedQuantity < 1) {
      return res.status(400).json({
        message: "La cantidad debe ser mayor o igual a 1",
      });
    }

    const product = await Product.findById(productId);

    if (!product || !product.is_active) {
      return res.status(404).json({
        message: "Producto no encontrado o inactivo",
      });
    }

    const basePrice = Number(product?.pricing?.tiers?.[0]?.price || 0);

    if (basePrice <= 0) {
      return res.status(400).json({
        message: "El producto no tiene precio válido",
      });
    }

    let cart = await Cart.findOne(ownerFilter);

    if (!cart) {
      cart = await Cart.create({
        ...ownerData,
        items: [],
        total: 0,
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product_id.toString() === productId
    );

    if (itemIndex >= 0) {
      const currentQty = Number(cart.items[itemIndex].quantity || 0);
      const newQuantity = currentQty + parsedQuantity;
      const rebuiltItem = await buildCartItemFromProduct(product, newQuantity);

      cart.items[itemIndex].name = rebuiltItem.name;
      cart.items[itemIndex].thumbnail = rebuiltItem.thumbnail;
      cart.items[itemIndex].quantity = rebuiltItem.quantity;
      cart.items[itemIndex].unit_price = rebuiltItem.unit_price;
      cart.items[itemIndex].subtotal = rebuiltItem.subtotal;
      cart.items[itemIndex].product_type = rebuiltItem.product_type;
      cart.items[itemIndex].box_items = rebuiltItem.box_items;
    } else {
      const builtItem = await buildCartItemFromProduct(product, parsedQuantity);
      cart.items.push(builtItem);
    }

    cart.total = recalculateCartTotal(cart.items);

    await cart.save();

    const refreshedCart = await Cart.findById(cart._id);
    const enrichedItems = await enrichCartItems(refreshedCart.items || []);

    return res.status(200).json({
      message: "Producto agregado al carrito",
      cart: {
        ...refreshedCart.toObject(),
        items: enrichedItems,
        total: recalculateCartTotal(enrichedItems),
      },
    });
  } catch (error) {
    console.error("ADD ITEM TO CART ERROR:", error);

    return res.status(500).json({
      message: "Error al agregar producto al carrito",
      error: error.message,
    });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const ownerFilter = getCartOwnerFilter(req);
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!ownerFilter) {
      return res.status(400).json({
        message: "No se pudo identificar el carrito. Falta token o x-guest-id.",
      });
    }

    const parsedQuantity = Number(quantity);

    if (!parsedQuantity || parsedQuantity < 1) {
      return res.status(400).json({
        message: "La cantidad debe ser mayor o igual a 1",
      });
    }

    const cart = await Cart.findOne(ownerFilter);

    if (!cart) {
      return res.status(404).json({
        message: "Carrito no encontrado",
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product_id.toString() === productId
    );

    if (itemIndex < 0) {
      return res.status(404).json({
        message: "Producto no existe en el carrito",
      });
    }

    const product = await Product.findById(productId);

    if (!product || !product.is_active) {
      return res.status(404).json({
        message: "Producto no encontrado o inactivo",
      });
    }

    const basePrice = Number(product?.pricing?.tiers?.[0]?.price || 0);

    if (basePrice <= 0) {
      return res.status(400).json({
        message: "El producto no tiene precio válido",
      });
    }

    const rebuiltItem = await buildCartItemFromProduct(product, parsedQuantity);

    cart.items[itemIndex].name = rebuiltItem.name;
    cart.items[itemIndex].thumbnail = rebuiltItem.thumbnail;
    cart.items[itemIndex].quantity = rebuiltItem.quantity;
    cart.items[itemIndex].unit_price = rebuiltItem.unit_price;
    cart.items[itemIndex].subtotal = rebuiltItem.subtotal;
    cart.items[itemIndex].product_type = rebuiltItem.product_type;
    cart.items[itemIndex].box_items = rebuiltItem.box_items;

    cart.total = recalculateCartTotal(cart.items);

    await cart.save();

    const refreshedCart = await Cart.findById(cart._id);
    const enrichedItems = await enrichCartItems(refreshedCart.items || []);

    return res.status(200).json({
      message: "Cantidad actualizada correctamente",
      cart: {
        ...refreshedCart.toObject(),
        items: enrichedItems,
        total: recalculateCartTotal(enrichedItems),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al actualizar el carrito",
      error: error.message,
    });
  }
};

export const removeItemFromCart = async (req, res) => {
  try {
    const ownerFilter = getCartOwnerFilter(req);
    const { productId } = req.params;

    if (!ownerFilter) {
      return res.status(400).json({
        message: "No se pudo identificar el carrito. Falta token o x-guest-id.",
      });
    }

    const cart = await Cart.findOne(ownerFilter);

    if (!cart) {
      return res.status(404).json({
        message: "Carrito no encontrado",
      });
    }

    cart.items = cart.items.filter(
      (item) => item.product_id.toString() !== productId
    );

    cart.total = recalculateCartTotal(cart.items);

    await cart.save();

    const refreshedCart = await Cart.findById(cart._id);
    const enrichedItems = await enrichCartItems(refreshedCart.items || []);

    return res.status(200).json({
      message: "Producto eliminado del carrito",
      cart: {
        ...refreshedCart.toObject(),
        items: enrichedItems,
        total: recalculateCartTotal(enrichedItems),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al eliminar producto del carrito",
      error: error.message,
    });
  }
};

export const clearCart = async (req, res) => {
  try {
    const ownerFilter = getCartOwnerFilter(req);

    if (!ownerFilter) {
      return res.status(400).json({
        message: "No se pudo identificar el carrito. Falta token o x-guest-id.",
      });
    }

    const cart = await Cart.findOne(ownerFilter);

    if (!cart) {
      return res.status(404).json({
        message: "Carrito no encontrado",
      });
    }

    cart.items = [];
    cart.total = 0;

    await cart.save();

    return res.status(200).json({
      message: "Carrito vaciado correctamente",
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al vaciar el carrito",
      error: error.message,
    });
  }
};