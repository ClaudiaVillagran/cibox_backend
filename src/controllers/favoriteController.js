import Favorite from "../models/Favorite.js";
import Product from "../models/Product.js";

const getFavoriteOwnerFilter = (req) => {
  if (req.user?.id) {
    return { user_id: req.user.id };
  }

  const guestId = req.headers["x-guest-id"];

  if (guestId) {
    return { guest_id: guestId };
  }

  return null;
};

const getFavoriteOwnerData = (req) => {
  if (req.user?.id) {
    return {
      user_id: req.user.id,
      guest_id: null,
    };
  }

  const guestId = req.headers["x-guest-id"];

  if (guestId) {
    return {
      user_id: null,
      guest_id: guestId,
    };
  }

  return null;
};

export const addFavorite = async (req, res) => {
  try {
    const ownerFilter = getFavoriteOwnerFilter(req);
    const ownerData = getFavoriteOwnerData(req);
    const { productId } = req.body;

    if (!ownerFilter || !ownerData) {
      return res.status(400).json({
        message: "No se pudo identificar al usuario o invitado",
      });
    }

    if (!productId) {
      return res.status(400).json({
        message: "productId es obligatorio",
      });
    }

    const product = await Product.findById(productId);

    if (!product || !product.is_active) {
      return res.status(404).json({
        message: "Producto no encontrado o inactivo",
      });
    }

    const existingFavorite = await Favorite.findOne({
      ...ownerFilter,
      product_id: productId,
    });

    if (existingFavorite) {
      return res.status(400).json({
        message: "El producto ya está en favoritos",
      });
    }

    const favorite = await Favorite.create({
      ...ownerData,
      product_id: productId,
    });

    return res.status(201).json({
      message: "Producto agregado a favoritos",
      favorite,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al agregar favorito",
      error: error.message,
    });
  }
};

export const getMyFavorites = async (req, res) => {
  try {
    const ownerFilter = getFavoriteOwnerFilter(req);

    if (!ownerFilter) {
      return res.status(200).json([]);
    }

    const favorites = await Favorite.find(ownerFilter)
      .populate("product_id")
      .sort({ created_at: -1 });

    return res.json(favorites);
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener favoritos",
      error: error.message,
    });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    const ownerFilter = getFavoriteOwnerFilter(req);
    const { productId } = req.params;

    if (!ownerFilter) {
      return res.status(400).json({
        message: "No se pudo identificar al usuario o invitado",
      });
    }

    const favorite = await Favorite.findOneAndDelete({
      ...ownerFilter,
      product_id: productId,
    });

    if (!favorite) {
      return res.status(404).json({
        message: "Favorito no encontrado",
      });
    }

    return res.json({
      message: "Producto eliminado de favoritos",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al eliminar favorito",
      error: error.message,
    });
  }
};

export const checkFavorite = async (req, res) => {
  try {
    const ownerFilter = getFavoriteOwnerFilter(req);
    const { productId } = req.params;

    if (!ownerFilter) {
      return res.json({
        is_favorite: false,
      });
    }

    const favorite = await Favorite.findOne({
      ...ownerFilter,
      product_id: productId,
    });

    return res.json({
      is_favorite: !!favorite,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al verificar favorito",
      error: error.message,
    });
  }
};