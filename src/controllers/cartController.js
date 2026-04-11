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

    return res.status(200).json(cart);
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
      cart.items[itemIndex].quantity += parsedQuantity;
      cart.items[itemIndex].unit_price = basePrice;
      cart.items[itemIndex].subtotal =
        cart.items[itemIndex].quantity * basePrice;
      cart.items[itemIndex].thumbnail =
        product.thumbnail || product.images?.[0] || "";
      cart.items[itemIndex].name = product.name;
    } else {
      cart.items.push({
        product_id: product._id,
        name: product.name,
        thumbnail: product.thumbnail || product.images?.[0] || "",
        quantity: parsedQuantity,
        unit_price: basePrice,
        subtotal: parsedQuantity * basePrice,
      });
    }

    cart.total = recalculateCartTotal(cart.items);

    await cart.save();

    return res.status(200).json({
      message: "Producto agregado al carrito",
      cart,
    });
  } catch (error) {
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

    cart.items[itemIndex].quantity = parsedQuantity;
    cart.items[itemIndex].unit_price = basePrice;
    cart.items[itemIndex].subtotal = parsedQuantity * basePrice;
    cart.items[itemIndex].thumbnail =
      product.thumbnail || product.images?.[0] || "";
    cart.items[itemIndex].name = product.name;

    cart.total = recalculateCartTotal(cart.items);

    await cart.save();

    return res.status(200).json({
      message: "Cantidad actualizada correctamente",
      cart,
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

    return res.status(200).json({
      message: "Producto eliminado del carrito",
      cart,
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