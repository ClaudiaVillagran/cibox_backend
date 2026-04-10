import Review from "../models/Review.js";
import Product from "../models/Product.js";

export const updateProductRatingStats = async (productId) => {
  const reviews = await Review.find({ product_id: productId })
       .populate("user_id", "name email")
       .sort({ created_at: -1 });

  const reviewsCount = reviews.length;

  const averageRating =
    reviewsCount > 0
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviewsCount
      : 0;

  await Product.findByIdAndUpdate(productId, {
    average_rating: Number(averageRating.toFixed(1)),
    reviews_count: reviewsCount,
  });
};