import CouponUsage from "../models/CouponUsage.js";
import Order from "../models/Order.js";

export const validateCouponForUser = async ({ coupon, userId, subtotal }) => {
  if (!coupon) {
    return { valid: false, message: "Cupón no encontrado" };
  }

  if (!coupon.is_active) {
    return { valid: false, message: "Cupón inactivo" };
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, message: "Cupón expirado" };
  }

  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return { valid: false, message: "Cupón sin usos disponibles" };
  }

  if (subtotal < coupon.min_purchase) {
    return {
      valid: false,
      message: `Compra mínima requerida: ${coupon.min_purchase}`,
    };
  }

  const userUses = await CouponUsage.countDocuments({
    coupon_id: coupon._id,
    user_id: userId,
  });

  if (userUses >= coupon.max_uses_per_user) {
    return {
      valid: false,
      message: "Ya alcanzaste el máximo de usos para este cupón",
    };
  }

  if (coupon.first_purchase_only) {
    const previousOrders = await Order.countDocuments({ user_id: userId });
    if (previousOrders > 0) {
      return {
        valid: false,
        message: "Cupón válido solo para la primera compra",
      };
    }
  }

  return { valid: true };
};

export const calculateCouponDiscount = ({ coupon, subtotal }) => {
  if (!coupon) return 0;

  if (coupon.type === "percentage") {
    const discount = Math.round(subtotal * (coupon.value / 100));
    return Math.min(discount, subtotal);
  }

  if (coupon.type === "fixed") {
    return Math.min(coupon.value, subtotal);
  }

  return 0;
};