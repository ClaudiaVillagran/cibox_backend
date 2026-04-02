import Vendor from "../models/Vendor.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

export const getVendorDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const vendor = await Vendor.findOne({ user_id: userId });

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor no encontrado",
      });
    }

    const products = await Product.find({
      "vendor.id": vendor._id.toString(),
    });

    const productIds = products.map((product) => product._id.toString());

    const activeProducts = products.filter((product) => product.is_active).length;
    const inactiveProducts = products.filter((product) => !product.is_active).length;

    const orders = await Order.find({
      "items.product_id": { $in: productIds },
    }).sort({ created_at: -1 });

    let totalOrders = 0;
    let totalUnitsSold = 0;
    let totalRevenue = 0;

    const recentOrders = [];
    const productSalesMap = {};

    for (const order of orders) {
      const vendorItems = order.items.filter(
        (item) =>
          item.product_id && productIds.includes(item.product_id.toString())
      );

      if (vendorItems.length > 0) {
        totalOrders += 1;

        let orderVendorTotal = 0;

        for (const item of vendorItems) {
          totalUnitsSold += item.quantity;
          totalRevenue += item.subtotal;
          orderVendorTotal += item.subtotal;

          const key = item.product_id.toString();

          if (!productSalesMap[key]) {
            productSalesMap[key] = {
              product_id: key,
              name: item.name,
              total_quantity: 0,
              total_revenue: 0,
            };
          }

          productSalesMap[key].total_quantity += item.quantity;
          productSalesMap[key].total_revenue += item.subtotal;
        }

        recentOrders.push({
          order_id: order._id,
          created_at: order.created_at,
          status: order.status,
          vendor_total: orderVendorTotal,
          items_count: vendorItems.length,
        });
      }
    }

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.total_quantity - a.total_quantity)
      .slice(0, 5);

    res.json({
      vendor: {
        id: vendor._id,
        store_name: vendor.store_name,
        approved: vendor.approved,
        is_active: vendor.is_active,
        rating: vendor.rating,
      },
      stats: {
        total_products: products.length,
        active_products: activeProducts,
        inactive_products: inactiveProducts,
        total_orders: totalOrders,
        total_units_sold: totalUnitsSold,
        total_revenue: totalRevenue,
      },
      top_products: topProducts,
      recent_orders: recentOrders.slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener dashboard del vendor",
      error: error.message,
    });
  }
};

export const getVendorSalesSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { from, to } = req.query;

    const vendor = await Vendor.findOne({ user_id: userId });

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor no encontrado",
      });
    }

    const products = await Product.find({
      "vendor.id": vendor._id.toString(),
    });

    const productIds = products.map((product) => product._id.toString());

    const orders = await Order.find({
      ...(from || to
        ? {
            created_at: {
              ...(from ? { $gte: new Date(from) } : {}),
              ...(to ? { $lte: new Date(to) } : {}),
            },
          }
        : {}),
      "items.product_id": { $in: productIds },
    });

    let totalOrders = 0;
    let totalRevenue = 0;
    let totalUnitsSold = 0;

    for (const order of orders) {
      const vendorItems = order.items.filter(
        (item) =>
          item.product_id && productIds.includes(item.product_id.toString())
      );

      if (vendorItems.length > 0) {
        totalOrders += 1;

        for (const item of vendorItems) {
          totalRevenue += item.subtotal;
          totalUnitsSold += item.quantity;
        }
      }
    }

    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.json({
      summary: {
        total_orders: totalOrders,
        total_units_sold: totalUnitsSold,
        total_revenue: totalRevenue,
        average_ticket: Math.round(averageTicket),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener resumen de ventas del vendor",
      error: error.message,
    });
  }
};