import Coupon from "../models/Coupon.js";
import { createNotificationsForRole } from "../utils/notification.js";

export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      type,
      value,
      min_purchase,
      max_uses,
      max_uses_per_user,
      first_purchase_only,
      expires_at,
    } = req.body;

    if (!code || !type || value === undefined) {
      return res.status(400).json({
        message: "code, type y value son obligatorios",
      });
    }

    const existingCoupon = await Coupon.findOne({
      code: code.toUpperCase(),
    });

    if (existingCoupon) {
      return res.status(400).json({
        message: "El cupón ya existe",
      });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      type,
      value,
      min_purchase,
      max_uses,
      max_uses_per_user,
      first_purchase_only,
      expires_at,
    });
    await createNotificationsForRole({
      role: "customer",
      type: "coupon_created",
      title: "Nuevo cupón disponible",
      message: `Hay un nuevo cupón disponible: ${coupon.code}.`,
      data: {
        coupon_id: coupon._id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
      },
    });

    res.status(201).json({
      message: "Cupón creado correctamente",
      coupon,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al crear cupón",
      error: error.message,
    });
  }
};

export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ created_at: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener cupones",
      error: error.message,
    });
  }
};

export const toggleCouponActive = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        message: "Cupón no encontrado",
      });
    }

    coupon.is_active = !coupon.is_active;
    await coupon.save();

    res.json({
      message: "Estado del cupón actualizado correctamente",
      coupon,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar cupón",
      error: error.message,
    });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    const coupon = await Coupon.findOne({
      code: code?.toUpperCase(),
    });

    if (!coupon) {
      return res.status(404).json({
        message: "Cupón no encontrado",
      });
    }

    res.json(coupon);
  } catch (error) {
    res.status(500).json({
      message: "Error al validar cupón",
      error: error.message,
    });
  }
};
