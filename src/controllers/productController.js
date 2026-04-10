import Product from "../models/Product.js";
import Vendor from "../models/Vendor.js";
import { normalizeText } from "../utils/normalizeText.js";
import Favorite from "../models/Favorite.js";
import Pantry from "../models/Pantry.js";
import Order from "../models/Order.js";

export const createProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    let vendorData = null;

    if (req.user.role === "admin") {
      const { vendor: vendorBody } = req.body;

      if (!vendorBody?.id || !vendorBody?.name) {
        return res.status(400).json({
          message: "Admin debe enviar vendor.id y vendor.name",
        });
      }

      vendorData = {
        id: vendorBody.id,
        name: vendorBody.name,
      };
    } else {
      const vendor = await Vendor.findOne({ user_id: userId });

      if (!vendor) {
        return res.status(403).json({
          message: "El usuario no tiene vendor asociado",
        });
      }

      if (!vendor.approved) {
        return res.status(403).json({
          message: "Vendor no aprobado",
        });
      }

      if (!vendor.is_active) {
        return res.status(403).json({
          message: "Vendor inactivo",
        });
      }

      vendorData = {
        id: vendor._id.toString(),
        name: vendor.store_name,
      };
    }

    const product = await Product.create({
      ...req.body,
      search_name: normalizeText(req.body.name),
      vendor: vendorData,
    });

    res.status(201).json({
      message: "Producto creado correctamente",
      product,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al crear producto",
      error: error.message,
    });
  }
};

export const getProducts = async (req, res) => {
  try {
    const {
      category,
      vendor,
      search,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    const filters = {
      is_active: true,
    };

    if (category) {
      filters["category.id"] = category;
    }

    if (vendor) {
      filters["vendor.id"] = vendor;
    }

    if (search) {
      const normalizedSearch = normalizeText(search);
      filters.search_name = { $regex: normalizedSearch, $options: "i" };
    }

    let products = await Product.find(filters);

    if (minPrice || maxPrice) {
      products = products.filter((product) => {
        const tiers = product.pricing?.tiers || [];
        if (!tiers.length) return false;

        const lowestPrice = Math.min(...tiers.map((tier) => tier.price));

        if (minPrice && lowestPrice < Number(minPrice)) return false;
        if (maxPrice && lowestPrice > Number(maxPrice)) return false;

        return true;
      });
    }

    if (sort === "price_asc") {
      products.sort((a, b) => {
        const aPrice = Math.min(...a.pricing.tiers.map((tier) => tier.price));
        const bPrice = Math.min(...b.pricing.tiers.map((tier) => tier.price));
        return aPrice - bPrice;
      });
    }

    if (sort === "price_desc") {
      products.sort((a, b) => {
        const aPrice = Math.min(...a.pricing.tiers.map((tier) => tier.price));
        const bPrice = Math.min(...b.pricing.tiers.map((tier) => tier.price));
        return bPrice - aPrice;
      });
    }

    if (sort === "newest") {
      products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    if (sort === "oldest") {
      products.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.max(Number(limit), 1);

    const totalItems = products.length;
    const totalPages = Math.ceil(totalItems / limitNumber);
    const startIndex = (pageNumber - 1) * limitNumber;
    const endIndex = startIndex + limitNumber;

    const paginatedProducts = products.slice(startIndex, endIndex);

    res.json({
      data: paginatedProducts,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        totalItems,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener productos",
      error: error.message,
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Producto no encontrado",
      });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener producto",
      error: error.message,
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const vendor = await Vendor.findOne({ user_id: userId });
    const product = await Product.findById(req.params.id);

    console.log(product);
    if (!product) {
      return res.status(404).json({
        message: "Producto no encontrado",
      });
    }

    if (
      req.user.role !== "admin" &&
      (!vendor || product.vendor.id.toString() !== vendor._id.toString())
    ) {
      return res.status(403).json({
        message: "No puedes editar este producto",
      });
    }

    const updateData = { ...req.body };
    delete updateData.vendor;
    if (updateData.name) {
      updateData.search_name = normalizeText(updateData.name);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    );

    res.json({
      message: "Producto actualizado correctamente",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar producto",
      error: error.message,
    });
  }
};

export const deactivateProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const vendor = await Vendor.findOne({ user_id: userId });
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Producto no encontrado",
      });
    }

    if (
      req.user.role !== "admin" &&
      (!vendor || product.vendor.id.toString() !== vendor._id.toString())
    ) {
      return res.status(403).json({
        message: "No puedes desactivar este producto",
      });
    }

    product.is_active = false;
    await product.save();

    res.json({
      message: "Producto desactivado correctamente",
      product,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al desactivar producto",
      error: error.message,
    });
  }
};
export const getTopRatedProducts = async (req, res) => {
  try {
    const { category, limit = 10, minReviews = 1 } = req.query;

    const filters = {
      is_active: true,
      reviews_count: { $gte: Number(minReviews) },
    };

    if (category) {
      filters["category.id"] = category;
    }

    const products = await Product.find(filters)
      .sort({ average_rating: -1, reviews_count: -1, created_at: -1 })
      .limit(Number(limit));

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener productos mejor valorados",
      error: error.message,
    });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;

    const filters = {
      is_active: true,
    };

    if (category) {
      filters["category.id"] = category;
    }

    const products = await Product.find(filters)
      .sort({ reviews_count: -1, average_rating: -1, created_at: -1 })
      .limit(Number(limit));

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener productos destacados",
      error: error.message,
    });
  }
};

export const getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 8 } = req.query;

    const product = await Product.findById(id);

    if (!product || !product.is_active) {
      return res.status(404).json({
        message: "Producto no encontrado o inactivo",
      });
    }

    const maxResults = Number(limit);

    let relatedProducts = await Product.find({
      _id: { $ne: product._id },
      is_active: true,
      "category.id": product.category.id,
    })
      .sort({ average_rating: -1, reviews_count: -1, created_at: -1 })
      .limit(maxResults);

    if (relatedProducts.length < maxResults) {
      const existingIds = relatedProducts.map((p) => p._id.toString());

      const sameVendorProducts = await Product.find({
        _id: {
          $ne: product._id,
          $nin: existingIds,
        },
        is_active: true,
        "vendor.id": product.vendor.id,
      })
        .sort({ average_rating: -1, reviews_count: -1, created_at: -1 })
        .limit(maxResults - relatedProducts.length);

      relatedProducts = [...relatedProducts, ...sameVendorProducts];
    }

    res.json({
      base_product: {
        id: product._id,
        name: product.name,
        category: product.category,
        vendor: product.vendor,
      },
      related_products: relatedProducts,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener productos relacionados",
      error: error.message,
    });
  }
};

export const getRecommendedProductsForMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const favorites = await Favorite.find({ user_id: userId }).populate("product_id");
    const pantry = await Pantry.findOne({ user_id: userId });
    const orders = await Order.find({ user_id: userId });

    const categoryCount = {};
    const excludedProductIds = new Set();

    for (const favorite of favorites) {
      const product = favorite.product_id;

      if (product?.category?.id) {
        categoryCount[product.category.id] = (categoryCount[product.category.id] || 0) + 2;
      }

      if (product?._id) {
        excludedProductIds.add(product._id.toString());
      }
    }

    if (pantry?.items?.length) {
      for (const item of pantry.items) {
        const product = await Product.findById(item.product_id);

        if (product?.category?.id) {
          categoryCount[product.category.id] = (categoryCount[product.category.id] || 0) + 1;
        }

        if (product?._id) {
          excludedProductIds.add(product._id.toString());
        }
      }
    }

    for (const order of orders) {
      for (const item of order.items) {
        if (item.product_id) {
          const product = await Product.findById(item.product_id);

          if (product?.category?.id) {
            categoryCount[product.category.id] = (categoryCount[product.category.id] || 0) + 3;
          }

          excludedProductIds.add(item.product_id.toString());
        }
      }
    }

    const sortedCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .map(([categoryId]) => categoryId);

    if (!sortedCategories.length) {
      const fallbackProducts = await Product.find({ is_active: true })
        .sort({ average_rating: -1, reviews_count: -1, created_at: -1 })
        .limit(Number(limit));

      return res.json({
        based_on: "fallback_top_rated",
        recommended_products: fallbackProducts,
      });
    }

    let recommendedProducts = [];

    for (const categoryId of sortedCategories) {
      const remaining = Number(limit) - recommendedProducts.length;

      if (remaining <= 0) break;

      const products = await Product.find({
        is_active: true,
        "category.id": categoryId,
        _id: { $nin: Array.from(excludedProductIds) },
      })
        .sort({ average_rating: -1, reviews_count: -1, created_at: -1 })
        .limit(remaining);

      for (const product of products) {
        recommendedProducts.push(product);
        excludedProductIds.add(product._id.toString());
      }
    }

    if (recommendedProducts.length < Number(limit)) {
      const remaining = Number(limit) - recommendedProducts.length;

      const fallbackProducts = await Product.find({
        is_active: true,
        _id: { $nin: Array.from(excludedProductIds) },
      })
        .sort({ average_rating: -1, reviews_count: -1, created_at: -1 })
        .limit(remaining);

      recommendedProducts = [...recommendedProducts, ...fallbackProducts];
    }

    res.json({
      based_on: {
        favorite_categories: sortedCategories,
      },
      recommended_products: recommendedProducts,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener productos recomendados",
      error: error.message,
    });
  }
};

export const reactivateProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const vendor = await Vendor.findOne({ user_id: userId });
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Producto no encontrado",
      });
    }

    if (
      req.user.role !== "admin" &&
      (!vendor || product.vendor.id.toString() !== vendor._id.toString())
    ) {
      return res.status(403).json({
        message: "No puedes reactivar este producto",
      });
    }

    product.is_active = true;
    await product.save();

    res.json({
      message: "Producto reactivado correctamente",
      product,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al reactivar producto",
      error: error.message,
    });
  }
};
export const updateProductStock = async (req, res) => {
  try {
    const userId = req.user.id;
    const { stock } = req.body;

    const vendor = await Vendor.findOne({ user_id: userId });
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Producto no encontrado",
      });
    }

    if (
      req.user.role !== "admin" &&
      (!vendor || String(product.vendor?.id) !== String(vendor._id))
    ) {
      return res.status(403).json({
        message: "No puedes editar el stock de este producto",
      });
    }

    const stockNumber = Number(stock);

    if (Number.isNaN(stockNumber) || stockNumber < 0) {
      return res.status(400).json({
        message: "El stock debe ser un número mayor o igual a 0",
      });
    }

    product.stock = stockNumber;
    await product.save();

    res.json({
      message: "Stock actualizado correctamente",
      product,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar stock",
      error: error.message,
    });
  }
};
