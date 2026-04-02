import Favorite from "../models/Favorite.js";
import Product from "../models/Product.js";

export const addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

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
      user_id: userId,
      product_id: productId,
    });

    if (existingFavorite) {
      return res.status(400).json({
        message: "El producto ya está en favoritos",
      });
    }

    const favorite = await Favorite.create({
      user_id: userId,
      product_id: productId,
    });

    res.status(201).json({
      message: "Producto agregado a favoritos",
      favorite,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al agregar favorito",
      error: error.message,
    });
  }
};

export const getMyFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    const favorites = await Favorite.find({ user_id: userId })
      .populate("product_id")
      .sort({ created_at: -1 });

    res.json(favorites);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener favoritos",
      error: error.message,
    });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const favorite = await Favorite.findOneAndDelete({
      user_id: userId,
      product_id: productId,
    });

    if (!favorite) {
      return res.status(404).json({
        message: "Favorito no encontrado",
      });
    }

    res.json({
      message: "Producto eliminado de favoritos",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al eliminar favorito",
      error: error.message,
    });
  }
};

export const checkFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const favorite = await Favorite.findOne({
      user_id: userId,
      product_id: productId,
    });

    res.json({
      is_favorite: !!favorite,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al verificar favorito",
      error: error.message,
    });
  }
};