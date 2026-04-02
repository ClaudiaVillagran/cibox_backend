import Product from "../models/Product.js";
import Vendor from "../models/Vendor.js";

export const createProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    let vendorData = null;

    if (req.user.role === "admin") {
      const { vendor } = req.body;

      if (!vendor?.id || !vendor?.name) {
        return res.status(400).json({
          message: "Admin debe enviar vendor.id y vendor.name",
        });
      }

      vendorData = {
        id: vendor.id,
        name: vendor.name,
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
    const products = await Product.find({ is_active: true });

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

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
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