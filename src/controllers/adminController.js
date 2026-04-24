import User from "../models/User.js";
import Order from "../models/Order.js";
import Vendor from "../models/Vendor.js";
import Product from "../models/Product.js";
import {
  createNotification,
  createNotificationsForRole,
} from "../utils/notification.js";
import { sendEmail } from "../services/emailService.js";
import {
  buildOrderStatusChangedTemplate,
  buildVendorApprovedTemplate,
  buildProductDeactivatedTemplate,
} from "../utils/emailTemplates.js";
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalVendors,
      pendingVendors,
      totalProducts,
      activeProducts,
      inactiveProducts,
      totalOrders,
      recentUsers,
      recentOrders,
      ordersByStatusRaw,
      salesAgg,
    ] = await Promise.all([
      User.countDocuments(),
      Vendor.countDocuments(),
      Vendor.countDocuments({ approved: false, is_active: true }),
      Product.countDocuments(),
      Product.countDocuments({ is_active: true }),
      Product.countDocuments({ is_active: false }),
      Order.countDocuments(),
      User.find().select("-password").sort({ created_at: -1 }).limit(5),
      Order.find()
        .populate("user_id", "name email")
        .sort({ created_at: -1 })
        .limit(5),
      Order.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$total" },
          },
        },
      ]),
    ]);

    const ordersByStatus = {
      pending: 0,
      paid: 0,
      preparing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    for (const item of ordersByStatusRaw) {
      ordersByStatus[item._id] = item.count;
    }

    const totalSales = salesAgg.length ? salesAgg[0].totalSales : 0;

    res.json({
      stats: {
        users: totalUsers,
        vendors: totalVendors,
        pending_vendors: pendingVendors,
        products: totalProducts,
        active_products: activeProducts,
        inactive_products: inactiveProducts,
        orders: totalOrders,
        total_sales: totalSales,
        orders_by_status: ordersByStatus,
      },
      recent_users: recentUsers,
      recent_orders: recentOrders,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener dashboard",
      error: error.message,
    });
  }
};

export const getSalesSummary = async (req, res) => {
  try {
    const { from, to } = req.query;

    const dateFilter = {};

    if (from || to) {
      dateFilter.created_at = {};
      if (from) dateFilter.created_at.$gte = new Date(from);
      if (to) dateFilter.created_at.$lte = new Date(to);
    }

    const orders = await Order.find(dateFilter);

    const totalOrders = orders.length;
    const totalSales = orders.reduce((acc, order) => acc + order.total, 0);
    const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    res.json({
      summary: {
        total_orders: totalOrders,
        total_sales: totalSales,
        average_ticket: Math.round(averageTicket),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener resumen de ventas",
      error: error.message,
    });
  }
};

export const getTopSellingProducts = async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product_id",
          name: { $first: "$items.name" },
          total_quantity: { $sum: "$items.quantity" },
          total_revenue: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { total_quantity: -1 } },
      { $limit: 10 },
    ]);

    res.json(topProducts);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener top de productos",
      error: error.message,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ created_at: -1 });

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
      { new: true, runValidators: true },
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
      { new: true, runValidators: true },
    );

    if (!order) {
      return res.status(404).json({
        message: "Orden no encontrada",
      });
    }

    await createNotification({
      userId: order.user_id,
      type: "order_status_changed",
      title: "Actualización de pedido",
      message: `Tu pedido ${order._id} ahora está en estado: ${order.status}.`,
      data: {
        order_id: order._id,
        status: order.status,
      },
    });

    if (status === "cancelled") {
      await createNotificationsForRole({
        role: "admin",
        type: "admin_order_cancelled",
        title: "Pedido cancelado",
        message: `La orden ${order._id} fue marcada como cancelada.`,
        data: {
          order_id: order._id,
          user_id: order.user_id,
        },
      });
    }
    if (order.customer?.email) {
      const emailTemplate = buildOrderStatusChangedTemplate({
        name: order.customer?.fullName || "cliente",
        orderId: order._id,
        status: order.status,
        trackingNumber: order.shipping?.tracking_number || null,
      });

      try {
        await sendEmail({
          to: order.customer.email,
          subject: emailTemplate.subject,
          text: emailTemplate.text,
          html: emailTemplate.html,
        });
      } catch (emailError) {
        console.error("ORDER STATUS EMAIL ERROR:", emailError.message);
      }
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
      { new: true },
    ).populate("user_id", "name email role");

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor no encontrado",
      });
    }

    await createNotification({
      userId: vendor.user_id._id || vendor.user_id,
      type: "vendor_approved",
      title: "Vendor aprobado",
      message: `Tu tienda ${vendor.store_name} fue aprobada correctamente.`,
      data: {
        vendor_id: vendor._id,
        store_name: vendor.store_name,
      },
    });
    if (vendor.user_id?.email) {
      const emailTemplate = buildVendorApprovedTemplate({
        name: vendor.user_id?.name || "usuario",
        storeName: vendor.store_name,
      });

      try {
        await sendEmail({
          to: vendor.user_id.email,
          subject: emailTemplate.subject,
          text: emailTemplate.text,
          html: emailTemplate.html,
        });
      } catch (emailError) {
        console.error("VENDOR APPROVED EMAIL ERROR:", emailError.message);
      }
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

    if (!product.is_active && product.vendor?.id) {
      const vendor = await Vendor.findById(product.vendor.id);

      if (vendor?.user_id) {
        await createNotification({
          userId: vendor.user_id,
          type: "vendor_product_deactivated",
          title: "Producto desactivado",
          message: `Tu producto ${product.name} fue desactivado por un administrador.`,
          data: {
            product_id: product._id,
            product_name: product.name,
          },
        });
        const vendorUser = await User.findById(vendor.user_id);

        if (vendorUser?.email) {
          const emailTemplate = buildProductDeactivatedTemplate({
            name: vendorUser.name || "usuario",
            productName: product.name,
          });

          try {
            await sendEmail({
              to: vendorUser.email,
              subject: emailTemplate.subject,
              text: emailTemplate.text,
              html: emailTemplate.html,
            });
          } catch (emailError) {
            console.error(
              "PRODUCT DEACTIVATED EMAIL ERROR:",
              emailError.message,
            );
          }
        }
      }
    }

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
