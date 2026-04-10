import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Vendor from "../models/Vendor.js";
import {
  createNotification,
  createNotificationsForRole,
} from "../utils/notification.js";
import { updateProductRatingStats } from "../utils/review.js";

export const createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, rating, comment } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({
        message: "productId y rating son obligatorios",
      });
    }

    const product = await Product.findById(productId);

    if (!product || !product.is_active) {
      return res.status(404).json({
        message: "Producto no encontrado o inactivo",
      });
    }

    const alreadyReviewed = await Review.findOne({
      user_id: userId,
      product_id: productId,
    });

    if (alreadyReviewed) {
      return res.status(400).json({
        message: "Ya dejaste una reseña para este producto",
      });
    }

    const hasPurchased = await Order.findOne({
      user_id: userId,
      "items.product_id": productId,
    });

    if (!hasPurchased) {
      return res.status(403).json({
        message: "Solo puedes reseñar productos que hayas comprado",
      });
    }

    const review = await Review.create({
      user_id: userId,
      product_id: productId,
      rating,
      comment,
    });

    await updateProductRatingStats(productId);

    await createNotification({
      userId,
      type: "review_created",
      title: "Reseña publicada",
      message: `Tu reseña para ${product.name} fue publicada correctamente.`,
      data: {
        review_id: review._id,
        product_id: product._id,
        rating: review.rating,
      },
    });

    await createNotificationsForRole({
      role: "admin",
      type: "admin_new_review",
      title: "Nueva reseña creada",
      message: `Se creó una nueva reseña para el producto ${product.name}.`,
      data: {
        review_id: review._id,
        product_id: product._id,
        rating: review.rating,
      },
    });

    if (product.vendor?.id) {
      const vendor = await Vendor.findById(product.vendor.id);

      if (vendor?.user_id) {
        await createNotification({
          userId: vendor.user_id,
          type: "vendor_new_review",
          title: "Nueva reseña en tu producto",
          message: `Tu producto ${product.name} recibió una nueva reseña.`,
          data: {
            review_id: review._id,
            product_id: product._id,
            rating: review.rating,
          },
        });
      }
    }

    res.status(201).json({
      message: "Reseña creada correctamente",
      review,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al crear reseña",
      error: error.message,
    });
  }
};
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product_id: productId })
      .populate("user_id", "name email")
      .sort({ created_at: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener reseñas",
      error: error.message,
    });
  }
};

export const updateMyReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findOne({
      user_id: userId,
      product_id: productId,
    });

    if (!review) {
      return res.status(404).json({
        message: "Reseña no encontrada",
      });
    }

    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    await review.save();
    await updateProductRatingStats(productId);

    res.json({
      message: "Reseña actualizada correctamente",
      review,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar reseña",
      error: error.message,
    });
  }
};

export const deleteMyReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const review = await Review.findOneAndDelete({
      user_id: userId,
      product_id: productId,
    });

    if (!review) {
      return res.status(404).json({
        message: "Reseña no encontrada",
      });
    }

    await updateProductRatingStats(productId);

    res.json({
      message: "Reseña eliminada correctamente",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al eliminar reseña",
      error: error.message,
    });
  }
};

export const getMyReviewForProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const review = await Review.findOne({
      user_id: userId,
      product_id: productId,
    });

    res.json({
      has_review: !!review,
      review: review || null,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener tu reseña",
      error: error.message,
    });
  }
};
