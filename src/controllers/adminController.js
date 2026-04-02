import User from "../models/User.js";
import Order from "../models/Order.js";
import Vendor from "../models/Vendor.js";
import Product from "../models/Product.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ created_at: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener usuarios",
      error: error.message,
    });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["customer", "vendor", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Rol inválido",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    res.json({
      message: "Rol actualizado correctamente",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar rol",
      error: error.message,
    });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user_id", "name email role")
      .sort({ created_at: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener órdenes",
      error: error.message,
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "paid",
      "preparing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Estado inválido",
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        message: "Orden no encontrada",
      });
    }

    res.json({
      message: "Estado de la orden actualizado correctamente",
      order,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar estado de la orden",
      error: error.message,
    });
  }
};

export const getPendingVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({
      approved: false,
      is_active: true,
    }).populate("user_id", "name email role");

    res.json(vendors);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener vendors pendientes",
      error: error.message,
    });
  }
};

export const approveVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    ).populate("user_id", "name email role");

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor no encontrado",
      });
    }

    res.json({
      message: "Vendor aprobado correctamente",
      vendor,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al aprobar vendor",
      error: error.message,
    });
  }
};

export const getAllProductsAdmin = async (req, res) => {
  try {
    const products = await Product.find().sort({ created_at: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener productos",
      error: error.message,
    });
  }
};

export const toggleProductActive = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Producto no encontrado",
      });
    }

    product.is_active = !product.is_active;
    await product.save();

    res.json({
      message: "Estado del producto actualizado correctamente",
      product,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al cambiar estado del producto",
      error: error.message,
    });
  }
};