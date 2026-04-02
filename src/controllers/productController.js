import Product from "../models/Product.js";
import Vendor from "../models/Vendor.js";
import { normalizeText } from "../utils/normalizeText.js";

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
    const { category, vendor, search, minPrice, maxPrice, sort } = req.query;

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

    res.json(products);
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
